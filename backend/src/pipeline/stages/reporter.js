const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');

const ANSI_RE = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;

const ReporterOutputSchema = z.object({
  health_score: z.string(),
  summary: z.object({
    passed: z.number().int(),
    failed: z.number().int(),
    total: z.number().int(),
    duration: z.string(),
  }),
  issues: z.array(z.object({
    page: z.string(),
    file: z.string().nullable(),
    error: z.string(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  })),
});

function normalizeReporterOutput(result) {
  const summary = result.summary || {};
  return {
    health_score: result.health_score || '0/100',
    summary: {
      passed: Number.isInteger(summary.passed) ? summary.passed : 0,
      failed: Number.isInteger(summary.failed) ? summary.failed : 0,
      total: Number.isInteger(summary.total) ? summary.total : 0,
      duration: summary.duration || '0 seconds',
    },
    issues: Array.isArray(result.issues)
      ? result.issues.map(issue => ({
        page: issue.page || 'Unknown page',
        file: issue.file || issue.page || 'Unknown file',
        error: issue.error || 'No issue details were provided.',
        severity: ['Critical', 'High', 'Medium', 'Low'].includes(issue.severity) ? issue.severity : 'Low',
      }))
      : [],
  };
}

function optimizeReportForLLM(rawReport) {
  const optimized = { summary: rawReport.stats || {}, failed_tests: [] };
  const seen = new Set();

  for (const err of (rawReport.errors || [])) {
    const message = (err.message || err.stack || '').replace(ANSI_RE, '').trim();
    if (!message) continue;
    optimized.failed_tests.push({
      title: 'Playwright runner error',
      file: 'playwright.config.ts',
      error_summary: message,
    });
  }

  for (const tc of (rawReport.test_cases || [])) {
    const title = (tc.title || '').split(' > ').pop();
    if (!tc.errors || tc.errors.length === 0 || seen.has(title)) continue;
    seen.add(title);

    const clean = (tc.errors[0] || '').replace(ANSI_RE, '');
    const coreLines = [];
    for (const line of clean.split('\n')) {
      if (line.includes('Call log:')) break;
      if (line.trim() && !line.includes('Error: expect')) coreLines.push(line.trim());
    }
    optimized.failed_tests.push({
      title,
      file: tc.file || 'Unknown file',
      error_summary: coreLines.join('\n'),
    });
  }

  return optimized;
}

async function run(executorJsonPath, outputDir) {
  const rawReport = JSON.parse(fs.readFileSync(executorJsonPath, 'utf-8'));
  const data = optimizeReportForLLM(rawReport);

  const { model, systemPrompt, temperature } = loadPrompt('Reporter');
  const userPrompt = '\n' + JSON.stringify(data, null, 2);

  let result;
  try {
    result = normalizeReporterOutput(await parseStructured(model, systemPrompt, userPrompt, ReporterOutputSchema, 'ReporterOutput', { temperature }));
  } catch (err) {
    console.error(`[Reporter] Parse error: ${err.message}`);
    result = {
      health_score: '0/100',
      summary: { passed: 0, failed: 0, total: 0, duration: '0s' },
      issues: [],
    };
  }

  const finalReportPath = path.join(outputDir, 'final_report.json');
  fs.writeFileSync(finalReportPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`[Reporter] Health Score: ${result.health_score}`);
  return result;
}

module.exports = { run };
