const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');
const { optimizeCodeForLLM } = require('../../lib/astParser');
const { AI_MAX_WORKERS } = require('../../config/env');
const { mapConcurrent } = require('../../lib/concurrency');
const { scanRoutes } = require('./routeScanner');
const { formatProfileForPrompt } = require('../../lib/frameworkProfile');

// Minimum score for a file to be analyzed. Files below this are pure noise
// (shadcn primitives, config, utils) and are always excluded.
// Set to -Infinity to disable and analyze everything regardless of score.
const ANALYZER_SCORE_THRESHOLD = 0;

// Hard cap to protect against runaway costs on very large projects (monorepos, etc.).
// Set to Infinity to remove the cap entirely.
const ANALYZER_FILE_LIMIT = Infinity;

// ── Smart file prioritization ─────────────────────────────────────────────────

const SCORE_RULES = [
  // ── Entry points (framework-agnostic) ──────────────────────────────────────
  // React/CRA/Vite: App.jsx, main.tsx
  { test: fp => /(?:^|\/)(?:app|main)\.(jsx?|tsx?)$/.test(fp),                        points: 5, reason: 'SPA entry point' },
  // Angular: app.component.ts
  { test: fp => /(?:^|\/)app\.component\.ts$/.test(fp),                               points: 5, reason: 'Angular root component' },
  // Next.js / Nuxt app router: app/layout.tsx, app/page.tsx, app/template.tsx
  { test: fp => /(?:^|\/)app\/(?:[^/]+\/)*(?:page|layout|template)\.(tsx?|jsx?)$/.test(fp), points: 4, reason: 'Next.js app router page/layout' },

  // ── Page-level components ──────────────────────────────────────────────────
  // React pages/, Next.js pages/, Nuxt pages/
  { test: fp => /(?:^|\/)pages\//.test(fp),                                            points: 3, reason: 'pages/ directory' },
  // Angular: *.component.ts (non-root)
  { test: fp => /\.component\.(ts|tsx)$/.test(fp) && !/app\.component/.test(fp),      points: 2, reason: 'Angular component' },

  // ── Business logic components ──────────────────────────────────────────────
  // React/Vue/Angular components (not UI library subfolder)
  { test: fp => /(?:^|\/)components\//.test(fp) && !/\/ui\//.test(fp),                points: 2, reason: 'business component' },
  // Backend: routes, controllers, services, middleware
  { test: fp => /(?:^|\/)(?:routes?|controllers?|services?|middleware|handlers?)\//.test(fp), points: 2, reason: 'backend logic' },

  // ── File-type bonuses ──────────────────────────────────────────────────────
  // JSX/TSX: likely renders UI
  { test: (fp, n, ext) => ['.jsx', '.tsx'].includes(ext),                              points: 1, reason: 'JSX/TSX' },
  // Vue SFC: treat same as JSX
  { test: (fp, n, ext) => ext === '.vue',                                              points: 1, reason: 'Vue SFC' },
  // Hooks / composables / custom logic
  { test: fp => /(?:^|\/)(?:hooks?|composables?|stores?)\//.test(fp),                 points: 1, reason: 'hook/composable/store' },

  // ── Low-value / noise (negative scores) ───────────────────────────────────
  // Shadcn / Radix / generic UI primitives folder
  { test: fp => /\/components\/ui\//.test(fp),                                         points: -4, reason: 'UI primitive folder' },
  // Known primitive component names (framework-agnostic list)
  { test: fp => /\/ui\/(?:accordion|alert|avatar|badge|breadcrumb|button|calendar|card|carousel|checkbox|collapsible|command|context|dialog|drawer|dropdown|form|hover|input|label|menu|navigation|pagination|popover|progress|radio|resizable|scroll|select|separator|sheet|skeleton|slider|sonner|switch|table|tabs|textarea|toast|toaster|toggle|tooltip)/.test(fp), points: -5, reason: 'known UI primitive' },
  // Utility / lib / helper files
  { test: fp => /(?:^|\/)(?:lib|utils?|helpers?|constants?|shared)\//.test(fp),       points: -2, reason: 'utility/lib' },
  // Build/tooling plugins
  { test: fp => /(?:^|\/)plugins?\//.test(fp),                                         points: -3, reason: 'plugin' },
  // Config files
  { test: (fp, name) => /\.(?:config|setup)\.(jsx?|tsx?|[cm]?js)$/.test(name),        points: -5, reason: 'config file' },
  // Test/spec files
  { test: (fp, name) => /\.(?:test|spec)\.(jsx?|tsx?|[cm]?js)$/.test(name),           points: -5, reason: 'test/spec file' },
  // Static data, assets, types
  { test: fp => /(?:^|\/)(?:data|assets|styles?|types?|interfaces?|dtos?|schemas?)\//.test(fp), points: -2, reason: 'non-logic file' },
  // Angular modules / routing (lower value than components)
  { test: fp => /\.(?:module|routing\.module)\.ts$/.test(fp),                          points: -1, reason: 'Angular module/routing' },
];

function scoreFile(fileInfo, workspaceDir) {
  const fp   = fileInfo.file_path.replace(/\\/g, '/').toLowerCase();
  const name = fileInfo.file_name.toLowerCase();
  const ext  = path.extname(fileInfo.file_name).toLowerCase();
  let score  = 0;

  for (const rule of SCORE_RULES) {
    if (rule.test(fp, name, ext)) score += rule.points;
  }

  // File size bonus — bigger files usually have more business logic
  try {
    const size = fs.statSync(path.join(workspaceDir, fileInfo.file_path)).size;
    if (size > 10000) score += 2;
    else if (size > 3000) score += 1;
  } catch { /* skip if file unreadable */ }

  return score;
}

function prioritizeFiles(sourceFiles, workspaceDir) {
  const scored = sourceFiles.map(f => ({ fileInfo: f, score: scoreFile(f, workspaceDir) }));
  scored.sort((a, b) => b.score - a.score || a.fileInfo.file_path.localeCompare(b.fileInfo.file_path));

  const eligible = scored.filter(s => s.score >= ANALYZER_SCORE_THRESHOLD);
  const excluded = scored.filter(s => s.score < ANALYZER_SCORE_THRESHOLD);

  console.log(`[Analyzer] File ranking: ${eligible.length} eligible (score ≥ ${ANALYZER_SCORE_THRESHOLD}), ${excluded.length} excluded as noise`);
  eligible.forEach(({ fileInfo, score }) => {
    console.log(`  [${String(score).padStart(3)}] ${fileInfo.file_path}`);
  });
  if (excluded.length > 0) {
    console.log(`  Excluded: ${excluded.map(s => s.fileInfo.file_name).join(', ')}`);
  }

  return eligible.map(s => s.fileInfo);
}

const EMPTY_ROUTE_CONTEXT = {
  rendered_at: [],
  requires_auth: false,
  auth_role: null,
  is_global_layout: false,
};

const UIElementSchema = z.object({
  element_type: z.string(),
  selector: z.string(),
  purpose: z.string(),
  // "Click the dropdown button first", "Submit step 1 form first", etc.
  depends_on: z.string().optional(),
  // true if this element is hidden until another action occurs
  is_conditional: z.boolean().optional(),
});

const APIEndpointSchema = z.object({
  function_name: z.string(),
  method: z.string(),
  route_or_target: z.string(),
  required_payload_fields: z.array(z.string()),
});

const TechnicalAnalysisOutputSchema = z.object({
  component_name: z.string(),
  module_type: z.string(),
  impact_level: z.string(),
  interactive_elements: z.array(UIElementSchema),
  extracted_endpoints: z.array(APIEndpointSchema),
  dependencies: z.array(z.string()),
  has_conditional_rendering: z.boolean(),
});

function normalizeAnalysis(result) {
  return {
    component_name: result.component_name || 'UnknownComponent',
    module_type: result.module_type || 'Unknown',
    impact_level: result.impact_level || 'Low',
    interactive_elements: Array.isArray(result.interactive_elements) ? result.interactive_elements : [],
    extracted_endpoints: Array.isArray(result.extracted_endpoints)
      ? result.extracted_endpoints.map(endpoint => ({
        function_name: endpoint.function_name || '',
        method: endpoint.method || 'GET',
        route_or_target: endpoint.route_or_target || '',
        required_payload_fields: Array.isArray(endpoint.required_payload_fields)
          ? endpoint.required_payload_fields
          : [],
      }))
      : [],
    dependencies: Array.isArray(result.dependencies) ? result.dependencies : [],
    has_conditional_rendering: Boolean(result.has_conditional_rendering),
  };
}

async function analyzeFile(workspaceDir, fileInfo, prompt, cacheDir, routeContext, frameworkProfile = null) {
  const fullPath = path.join(workspaceDir, fileInfo.file_path);
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }

  const optimized = optimizeCodeForLLM(content);
  const cacheKey = stableHash({
    stage: 'analyzer',
    model: prompt.model,
    system_prompt: prompt.systemPrompt,
    file_path: fileInfo.file_path,
    language: fileInfo.language,
    content: optimized,
    route_context: routeContext,
    framework_profile: frameworkProfile,
  });

  const cached = readCache(cacheDir, cacheKey);
  if (cached) return { ...cached, file_path: fileInfo.file_path };

  const frameworkHint = formatProfileForPrompt(frameworkProfile);
  const routeHint     = buildRouteHint(routeContext);
  const userPrompt =
    `Language: ${fileInfo.language}\n` +
    (frameworkHint ? `Framework Context:\n${frameworkHint}\n` : '') +
    (routeHint     ? `Route Context:\n${routeHint}\n`         : '') +
    `Source Code:\n\`\`\`\n${optimized}\n\`\`\``;

  const result = await parseStructured(
    prompt.model,
    prompt.systemPrompt,
    userPrompt,
    TechnicalAnalysisOutputSchema,
    'TechnicalAnalysisOutput'
  );

  const data = {
    ...normalizeAnalysis(result),
    file_path: fileInfo.file_path,
    route_context: routeContext,
  };
  writeCache(cacheDir, cacheKey, data);
  return data;
}

/**
 * Convert a RouteContext object into a concise natural-language hint for the AI prompt.
 */
function buildRouteHint(ctx) {
  if (!ctx || (ctx.rendered_at.length === 0 && !ctx.is_global_layout)) return '';

  const lines = [];
  if (ctx.is_global_layout) {
    lines.push('- This component is a GLOBAL LAYOUT element rendered on every page (e.g. Navbar, Footer, ChatBubble).');
    lines.push('- Do NOT assume it needs to navigate to a specific URL first.');
  } else if (ctx.rendered_at.length > 0) {
    lines.push(`- This component renders at: ${ctx.rendered_at.join(', ')}`);
  }

  if (ctx.requires_auth) {
    const role = ctx.auth_role ? ` (role: ${ctx.auth_role})` : '';
    lines.push(`- Requires authentication${role} before this component is visible.`);
  }

  if (ctx.inherited_from) {
    lines.push(`- Route inherited from parent component: ${ctx.inherited_from}`);
  }

  return lines.join('\n');
}

async function run(workspaceDir, detectorResultsPath, outputDir, cacheDir, options = {}, frameworkProfile = null) {
  const detectorData = JSON.parse(fs.readFileSync(detectorResultsPath, 'utf-8'));
  const allFiles = detectorData.source_files || [];
  const filesToAnalyze = prioritizeFiles(allFiles, workspaceDir).slice(0, ANALYZER_FILE_LIMIT);
  console.log(`[Analyzer] Analyzing ${filesToAnalyze.length}/${allFiles.length} files (cap: ${isFinite(ANALYZER_FILE_LIMIT) ? ANALYZER_FILE_LIMIT : 'none'}, threshold: ${ANALYZER_SCORE_THRESHOLD})`);
  if (filesToAnalyze.length === 0) return;

  // ── Pass 1: Route scan (framework-agnostic) ─────────────────────────────────
  console.log('[Analyzer] Running route scan...');
  let routeContextMap = {};
  try {
    routeContextMap = scanRoutes(detectorData.source_files || [], workspaceDir);
  } catch (err) {
    console.warn(`[Analyzer] Route scan failed (non-fatal): ${err.message}`);
  }

  // ── Pass 2: Per-file AI analysis (with route context injected) ──────────────
  const prompt = loadPrompt('Analyzer');
  const analyzerCacheDir = path.join(cacheDir, 'analyzer');

  const maxWorkers = Math.min(AI_MAX_WORKERS, filesToAnalyze.length) || 1;

  const results = await mapConcurrent(filesToAnalyze, maxWorkers, async (fileInfo) => {
    try {
      // Match by component name (basename without extension) OR exact basename
      const baseName = path.parse(fileInfo.file_name).name;
      const routeCtx = routeContextMap[baseName] || EMPTY_ROUTE_CONTEXT;
      return await analyzeFile(workspaceDir, fileInfo, prompt, analyzerCacheDir, routeCtx, frameworkProfile);
    } catch (err) {
      console.error(`[Analyzer] Error processing ${fileInfo.file_path}: ${err.message}`);
      return null;
    }
  }, { onProgress: options.onProgress });

  for (const data of results) {
    if (!data) continue;
    const safeName = data.file_path.replace(/[\\/]/g, '_');
    const outName = `${path.parse(safeName).name}_analysis.json`;
    fs.writeFileSync(
      path.join(outputDir, outName),
      JSON.stringify(data, null, 2),
      'utf-8'
    );
  }
}

module.exports = { run, prioritizeFiles };
