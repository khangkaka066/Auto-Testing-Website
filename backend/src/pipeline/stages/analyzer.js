const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');
const { optimizeCodeForLLM } = require('../../lib/astParser');
const { AI_MAX_WORKERS } = require('../../config/env');
const { mapConcurrent } = require('../../lib/concurrency');
const { scanRoutes } = require('./routeScanner');

const ANALYZER_FILE_LIMIT = 15;

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

async function analyzeFile(workspaceDir, fileInfo, prompt, cacheDir, routeContext) {
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
  });

  const cached = readCache(cacheDir, cacheKey);
  if (cached) return { ...cached, file_path: fileInfo.file_path };

  // Inject route context into the prompt so the AI has full picture
  const routeHint = buildRouteHint(routeContext);
  const userPrompt =
    `Language: ${fileInfo.language}\n` +
    (routeHint ? `Route Context:\n${routeHint}\n` : '') +
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

async function run(workspaceDir, detectorResultsPath, outputDir, cacheDir, options = {}) {
  const detectorData = JSON.parse(fs.readFileSync(detectorResultsPath, 'utf-8'));
  const filesToAnalyze = (detectorData.source_files || []).slice(0, ANALYZER_FILE_LIMIT);
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
      return await analyzeFile(workspaceDir, fileInfo, prompt, analyzerCacheDir, routeCtx);
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

module.exports = { run };
