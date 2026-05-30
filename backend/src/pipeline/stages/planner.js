const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');
const { AI_MAX_WORKERS } = require('../../config/env');

const TestScopeEnum = z.enum([
  'UI Testing', 'Functional Testing', 'Performance Testing',
  'Responsive Testing', 'Compatibility Testing', 'Security Testing',
  'API Testing', 'Navigation Testing', 'Integration Testing',
]);

const PlannedTestCaseSchema = z.object({
  case_id: z.string(),
  title: z.string(),
  priority: z.enum(['P0', 'P1', 'P2']),
  scope: TestScopeEnum,
  objective: z.string(),
  preconditions: z.array(z.string()).default([]),
  test_data: z.array(z.object({
    name: z.string(),
    value: z.string(),
    description: z.string().default(''),
  })).default([]),
  steps: z.array(z.string()).default([]),
  mock_strategy: z.object({
    type: z.enum(['none', 'route_intercept', 'service_stub', 'hybrid']).default('none'),
    targets: z.array(z.string()).default([]),
    notes: z.string().default(''),
  }).default({}),
  criteria: z.object({
    pass_when: z.array(z.string()).default([]),
    fail_when: z.array(z.string()).default([]),
  }).default({}),
});

const PlannerOutputSchema = z.object({
  planner_version: z.string().default('1.3'),
  component_name: z.string(),
  module_type: z.string(),
  impact_level: z.string(),
  should_generate_plan: z.boolean().default(true),
  skip_reason: z.string().default(''),
  requested_test_types: z.array(z.string()).default([]),
  skipped_test_types: z.array(z.string()).default([]),
  generation_notes: z.array(z.string()).default([]),
  test_cases: z.array(PlannedTestCaseSchema).default([]),
});

const SCOPE_CAPABILITIES = {
  'UI Testing': (m) => m.includes('UI'),
  'Functional Testing': (m, els, eps) => m.includes('UI') || eps.length > 0,
  'Performance Testing': () => true,
  'Responsive Testing': (m) => m.includes('UI'),
  'Compatibility Testing': (m) => m.includes('UI'),
  'Security Testing': (m, els, eps) => eps.length > 0 || !m.includes('UI'),
  'API Testing': (m, els, eps) => eps.length > 0 || !m.includes('UI'),
  'Navigation Testing': (m, els) => m.includes('UI') && els.length > 0,
  'Integration Testing': (m, els, eps) => eps.length > 0,
};

function resolveApplicableTypes(analyzerOutput, requestedTypes) {
  const moduleType = (analyzerOutput.module_type || '').toUpperCase();
  const elements = analyzerOutput.interactive_elements || [];
  const endpoints = analyzerOutput.extracted_endpoints || [];
  const requested = requestedTypes && requestedTypes.length > 0
    ? requestedTypes
    : (moduleType.includes('UI') ? ['UI Testing', 'Functional Testing'] : ['API Testing', 'Integration Testing']);

  const applicable = [];
  const skipped = [];
  const notes = [];

  for (const t of requested) {
    const check = SCOPE_CAPABILITIES[t];
    if (check && check(moduleType, elements, endpoints)) {
      applicable.push(t);
    } else {
      skipped.push(t);
      notes.push(`Skipped ${t}: not applicable for current metadata.`);
    }
  }
  return { applicable, skipped, notes };
}

async function planFile(analyzerFilePath, prompt, cacheDir, testType = 'UI Testing') {
  const content = JSON.parse(fs.readFileSync(analyzerFilePath, 'utf-8'));
  const { applicable, skipped, notes } = resolveApplicableTypes(content, [testType]);

  if (applicable.length === 0) {
    return {
      ...content,
      planner_version: '1.3',
      should_generate_plan: false,
      skip_reason: 'No applicable test types for this file.',
      requested_test_types: [testType],
      skipped_test_types: skipped,
      generation_notes: notes,
      test_cases: [],
    };
  }

  const payload = {
    analyzer_output: content,
    requested_test_types: applicable,
    original_requested_test_types: [testType],
    skipped_test_types: skipped,
    applicability_notes: notes,
  };

  const cacheKey = stableHash({
    stage: 'planner',
    model: prompt.model,
    system_prompt: prompt.systemPrompt,
    test_type: testType,
    analysis: content,
  });

  const cached = readCache(cacheDir, cacheKey);
  if (cached) return { ...cached, file_path: content.file_path };

  const userPrompt = `Analyzer metadata JSON:\n${JSON.stringify(payload, null, 2)}`;
  const result = await parseStructured(
    prompt.model,
    prompt.systemPrompt,
    userPrompt,
    PlannerOutputSchema,
    'PlannerOutput'
  );

  const data = {
    ...result,
    should_generate_plan: true,
    skip_reason: '',
    requested_test_types: applicable,
    skipped_test_types: skipped,
    generation_notes: [...notes, ...(result.generation_notes || [])],
    file_path: content.file_path,
  };

  writeCache(cacheDir, cacheKey, data);
  return data;
}

async function pLimit(items, maxConcurrent, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(batch.map(fn));
    for (const r of batchResults) {
      results.push(r.status === 'fulfilled' ? r.value : null);
    }
  }
  return results;
}

async function run(analyzerDir, outputDir, cacheDir, testType = 'UI Testing') {
  const analyzerFiles = fs.readdirSync(analyzerDir).filter(f => f.endsWith('.json'));
  if (analyzerFiles.length === 0) return;

  const prompt = loadPrompt('Planner');
  const plannerCacheDir = path.join(cacheDir, 'planner');
  const maxWorkers = Math.min(AI_MAX_WORKERS, analyzerFiles.length) || 1;

  const results = await pLimit(analyzerFiles, maxWorkers, async (filename) => {
    try {
      return await planFile(path.join(analyzerDir, filename), prompt, plannerCacheDir, testType);
    } catch (err) {
      console.error(`[Planner] Error processing ${filename}: ${err.message}`);
      return null;
    }
  });

  analyzerFiles.forEach((filename, i) => {
    const data = results[i];
    if (!data) return;
    const outName = filename.replace('_analysis.json', '_plan.json');
    fs.writeFileSync(path.join(outputDir, outName), JSON.stringify(data, null, 2), 'utf-8');
  });
}

module.exports = { run };
