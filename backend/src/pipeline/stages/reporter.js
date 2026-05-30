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
    error: z.string(),
    severity: z.enum(['Critical', 'High', 'Medium', 'Low']),
  })).default([]),
});

function optimizeReportForLLM(rawReport) {
  const optimized = { summary: rawReport.stats || {}, failed_tests: [] };
  const seen = new Set();

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
    optimized.failed_tests.push({ title, error_summary: coreLines.join('\n') });
  }

  return optimized;
}

async function run(executorJsonPath, outputDir) {
  const rawReport = JSON.parse(fs.readFileSync(executorJsonPath, 'utf-8'));
  const data = optimizeReportForLLM(rawReport);

  const { model, systemPrompt } = loadPrompt('Reporter');
  const userPrompt = '\n' + JSON.stringify(data, null, 2);

  let result;
  try {
    result = await parseStructured(model, systemPrompt, userPrompt, ReporterOutputSchema, 'ReporterOutput');
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
