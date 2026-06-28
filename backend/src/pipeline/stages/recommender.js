const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { optimizeCodeForLLM } = require('../../lib/astParser');

const MAX_ISSUES = 5;
const MAX_CODE_CHARS = 4000;
const MAX_SOURCE_FILES_PER_ISSUE = 2;

const RecommendationSchema = z.object({
  issue_index: z.number().int(),
  page: z.string(),
  source_file: z.string(),
  root_cause: z.string(),
  fix_description: z.string(),
  code_suggestion: z.string(),
});

const RecommenderOutputSchema = z.object({
  recommendations: z.array(RecommendationSchema),
});

function normalizeForMatch(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function extractKeywords(pageName) {
  return normalizeForMatch(pageName)
    .replace(/page|component|screen|view|module|admin|management/g, '')
    .trim();
}

function scoreAnalyzerEntry(issue, entry) {
  const keyword = extractKeywords(issue.page);
  if (!keyword) return 0;

  const componentNorm = normalizeForMatch(entry.component_name);
  const fileNorm = normalizeForMatch(entry.file_path);

  let score = 0;
  if (componentNorm.includes(keyword) || keyword.includes(componentNorm)) score += 4;
  if (fileNorm.includes(keyword)) score += 2;

  // word-level overlap
  const issueWords = (issue.page || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  for (const word of issueWords) {
    if (componentNorm.includes(word) || fileNorm.includes(word)) score += 1;
  }

  return score;
}

function findMatchingEntries(issue, analyzerEntries) {
  const scored = analyzerEntries
    .map(entry => ({ entry, score: scoreAnalyzerEntry(issue, entry) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_SOURCE_FILES_PER_ISSUE).map(s => s.entry);
}

function readSourceCode(sourceCodePath, filePath) {
  try {
    const fullPath = path.join(sourceCodePath, filePath);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const optimized = optimizeCodeForLLM(raw);
    return optimized.slice(0, MAX_CODE_CHARS);
  } catch {
    return null;
  }
}

function loadAnalyzerEntries(analyzerDir) {
  const entries = [];
  try {
    const files = fs.readdirSync(analyzerDir).filter(f => f.endsWith('_analysis.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(analyzerDir, file), 'utf-8'));
        entries.push(data);
      } catch { /* skip malformed */ }
    }
  } catch { /* analyzer dir missing */ }
  return entries;
}

function buildSourceContext(issue, analyzerEntries, sourceCodePath, isHighPriority) {
  const matched = findMatchingEntries(issue, analyzerEntries);

  if (matched.length === 0) return null;

  return matched.map(entry => {
    const ctx = {
      file_path: entry.file_path,
      component_name: entry.component_name,
      module_type: entry.module_type,
      interactive_elements: entry.interactive_elements || [],
      extracted_endpoints: entry.extracted_endpoints || [],
    };

    if (isHighPriority) {
      const code = readSourceCode(sourceCodePath, entry.file_path);
      if (code) ctx.source_code = code;
    }

    return ctx;
  });
}

function normalizeRecommendation(rec, totalIssues) {
  return {
    issue_index: typeof rec.issue_index === 'number' ? rec.issue_index : 0,
    page: rec.page || 'Unknown',
    source_file: rec.source_file || 'unknown',
    root_cause: rec.root_cause || 'Could not determine root cause.',
    fix_description: rec.fix_description || 'No fix description available.',
    code_suggestion: rec.code_suggestion || '// No code suggestion available.',
  };
}

async function run(reporterDir, analyzerDir, sourceCodePath, outputDir) {
  const finalReportPath = path.join(reporterDir, 'final_report.json');
  if (!fs.existsSync(finalReportPath)) {
    console.log('[Recommender] No final_report.json found — skipping.');
    return null;
  }

  const finalReport = JSON.parse(fs.readFileSync(finalReportPath, 'utf-8'));
  const allIssues = finalReport.issues || [];

  if (allIssues.length === 0) {
    console.log('[Recommender] No issues to recommend fixes for.');
    const result = { recommendations: [] };
    fs.writeFileSync(path.join(outputDir, 'recommendations.json'), JSON.stringify(result, null, 2), 'utf-8');
    return result;
  }

  // Prioritize Critical/High issues first, cap at MAX_ISSUES; preserve original index
  const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const prioritizedIssues = allIssues
    .map((issue, i) => ({ ...issue, _originalIndex: i }))
    .sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4))
    .slice(0, MAX_ISSUES);

  console.log(`[Recommender] Processing ${prioritizedIssues.length}/${allIssues.length} issues...`);

  const analyzerEntries = loadAnalyzerEntries(analyzerDir);
  console.log(`[Recommender] Loaded ${analyzerEntries.length} analyzer entries.`);

  const issuesPayload = prioritizedIssues.map((issue) => {
    const isHighPriority = issue.severity === 'Critical' || issue.severity === 'High';
    const sourceContexts = buildSourceContext(issue, analyzerEntries, sourceCodePath, isHighPriority);

    return {
      index: issue._originalIndex,
      page: issue.page,
      error: issue.error,
      severity: issue.severity,
      source_contexts: sourceContexts || [],
    };
  });

  const { model, systemPrompt } = loadPrompt('Recommender');
  const userContent = JSON.stringify({ issues: issuesPayload, all_source_summaries: analyzerEntries.map(e => ({
    file_path: e.file_path,
    component_name: e.component_name,
    module_type: e.module_type,
  })) }, null, 2);

  let result;
  try {
    result = await parseStructured(model, systemPrompt, userContent, RecommenderOutputSchema, 'RecommenderOutput');
  } catch (err) {
    console.error(`[Recommender] Parse error: ${err.message}`);
    result = { recommendations: prioritizedIssues.map((issue) => ({
      issue_index: issue._originalIndex,
      page: issue.page,
      source_file: 'unknown',
      root_cause: 'AI analysis failed.',
      fix_description: `Issue: ${issue.error}`,
      code_suggestion: '# Note: Could not generate code suggestion.',
    })) };
  }

  result.recommendations = result.recommendations.map(rec => normalizeRecommendation(rec, prioritizedIssues.length));

  const outputPath = path.join(outputDir, 'recommendations.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`[Recommender] Generated ${result.recommendations.length} fix recommendation(s).`);
  return result;
}

module.exports = { run };
