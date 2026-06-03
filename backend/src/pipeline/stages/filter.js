'use strict';

const fs   = require('fs');
const path = require('path');

// ── Confidence scoring ────────────────────────────────────────────────────────

function computeConfidenceScore(plannerData, analyzerData) {
  let score = 0;

  const routeCtx   = analyzerData?.route_context;
  const renderedAt = routeCtx?.rendered_at || [];

  // Route confidence (+2 if known, +1 if root-only)
  if (routeCtx?.is_global_layout) {
    score += 2; // global layouts always navigate to /
  } else if (renderedAt.length > 0 && renderedAt.some(r => r !== '/')) {
    score += 2; // at least one non-root known route
  } else if (renderedAt.length > 0) {
    score += 1; // only root route known
  }
  // else: 0 — route unknown

  // Selector quality (max +3)
  const elements = analyzerData?.interactive_elements || [];
  let selectorPoints = 0;
  for (const el of elements) {
    const sel = el.selector || '';
    if (/\[data-testid|^#[a-z]|\[id=/.test(sel)) {
      selectorPoints += 1;   // stable: data-testid or id
    } else if (sel.length > 0 && sel.length <= 60) {
      selectorPoints += 0.5; // short CSS class — reasonable
    }
  }
  score += Math.min(selectorPoints, 3);

  // Auth complexity (-1 — adds setup risk)
  if (routeCtx?.requires_auth) score -= 1;

  // Impact level (+2 high, +1 medium)
  const impact = (plannerData?.impact_level || '').toLowerCase();
  if (impact === 'high')   score += 2;
  else if (impact === 'medium') score += 1;

  return Math.max(0, Math.round(score));
}

function scoreToScope(score) {
  if (score >= 5) return 'FULL';
  if (score >= 3) return 'INTERACTION';
  return 'SMOKE';
}

// ── Analyzer data loader ──────────────────────────────────────────────────────

function loadAnalyzerIndex(analyzerDir) {
  const index = {};
  if (!analyzerDir || !fs.existsSync(analyzerDir)) return index;
  for (const f of fs.readdirSync(analyzerDir).filter(f => f.endsWith('_analysis.json'))) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(analyzerDir, f), 'utf-8'));
      index[f.replace('_analysis.json', '')] = d;
    } catch { /* skip corrupt */ }
  }
  return index;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run(plannerDir, outputDir, options = {}) {
  const analyzerIndex = loadAnalyzerIndex(options.analyzerDir || null);

  const files = fs.readdirSync(plannerDir).filter(f => f.endsWith('.json'));
  let validCount   = 0;
  let skippedCount = 0;

  for (const filename of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(plannerDir, filename), 'utf-8'));
      const testCases      = content.test_cases || [];
      const shouldGenerate = content.should_generate_plan;

      if (!shouldGenerate || testCases.length === 0) {
        console.log(`[Filter] Skip ${filename}: ${content.skip_reason || 'no test cases'}`);
        skippedCount++;
        continue;
      }

      // Compute confidence and assign scope
      const analyzerKey  = filename.replace('_plan.json', '');
      const analyzerData = analyzerIndex[analyzerKey] || null;
      const score        = computeConfidenceScore(content, analyzerData);
      const scope        = scoreToScope(score);

      console.log(`[Filter] ${filename} → score=${score} scope=${scope}`);
      content.test_scope         = scope;
      content.confidence_score   = score;

      fs.writeFileSync(
        path.join(outputDir, filename),
        JSON.stringify(content, null, 2),
        'utf-8',
      );
      validCount++;
    } catch (err) {
      console.error(`[Filter] Error reading ${filename}: ${err.message}`);
    }
  }

  console.log(`[Filter] Kept ${validCount} (FULL/INTERACTION/SMOKE assigned), skipped ${skippedCount} files.`);
}

module.exports = { run, computeConfidenceScore, scoreToScope };
