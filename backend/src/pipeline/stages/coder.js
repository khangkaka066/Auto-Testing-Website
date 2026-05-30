const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');
const { AI_MAX_WORKERS } = require('../../config/env');
const { mapConcurrent } = require('../../lib/concurrency');

const GeneratedSpecSchema = z.object({
  spec_file: z.string(),
  content: z.string(),
  test_case_count: z.number().int(),
});

const CoderBatchOutputSchema = z.object({
  generated: z.array(GeneratedSpecSchema),
});

const FORBIDDEN_PATTERNS = [
  'document.body.innerHTML', 'addEventListener(', 'page.$$eval(',
  '.evaluateAll(', 'MouseEvent', 'KeyboardEvent', 'EventListener',
  'jest.', 'sinon.', 'vi.', 'mount(', 'render(', 'screen.', 'as any',
];

function sanitizeName(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^_+|_+$/g, '') || 'generated';
}

function validateOutput(output) {
  const violations = [];
  if (output.generated.length !== 1) {
    violations.push('Output must contain exactly one generated spec file.');
  }
  for (const gen of output.generated) {
    if (!gen.content.trim()) violations.push(`${gen.spec_file}: content is empty.`);
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (gen.content.includes(pattern)) {
        violations.push(`${gen.spec_file}: forbidden pattern \`${pattern}\` found.`);
      }
    }
  }
  return violations;
}

function normalizeCoderOutput(output) {
  return {
    generated: Array.isArray(output.generated)
      ? output.generated.map(item => ({
        spec_file: item.spec_file || 'generated.spec.ts',
        content: item.content || '',
        test_case_count: Number.isInteger(item.test_case_count) ? item.test_case_count : 0,
      }))
      : [],
  };
}

async function generateOne(item, prompt, baseUrl, cacheDir) {
  const planner = item.planner_output || {};
  const promptPayload = {
    base_url: baseUrl,
    component: {
      name: item.component_name,
      source_file: planner.file_path || '',
      module_type: planner.module_type || '',
      impact_level: planner.impact_level || '',
      generation_notes: planner.generation_notes || [],
      test_cases: item.test_cases,
    },
    constraints: {
      framework: '@playwright/test',
      language: 'TypeScript',
      include_real_actions: true,
      compile_first: true,
      no_fake_dom: true,
    },
  };

  const userPrompt =
    'Generate one conservative Playwright E2E spec file (TypeScript) for the component below. ' +
    'Return ONLY JSON matching the CoderBatchOutput schema.\n' +
    JSON.stringify(promptPayload, null, 2);

  const cacheKey = stableHash({
    stage: 'coder',
    model: prompt.model,
    system_prompt: prompt.systemPrompt,
    base_url: baseUrl,
    item,
  });

  const cached = readCache(cacheDir, cacheKey);
  if (cached) {
    const parsed = CoderBatchOutputSchema.safeParse(cached);
    if (parsed.success) return parsed.data;
  }

  let output = normalizeCoderOutput(await parseStructured(
    prompt.model,
    prompt.systemPrompt,
    userPrompt,
    CoderBatchOutputSchema,
    'CoderBatchOutput'
  ));

  const violations = validateOutput(output);
  if (violations.length > 0) {
    const repairPayload = {
      violations,
      original_prompt: userPrompt,
      generated_output: output,
    };
    const repairPrompt =
      'Rewrite the generated Playwright spec to fix every violation below. ' +
      'Return ONLY JSON matching the CoderBatchOutput schema.\n' +
      JSON.stringify(repairPayload, null, 2);

    output = normalizeCoderOutput(await parseStructured(
      prompt.model,
      prompt.systemPrompt,
      repairPrompt,
      CoderBatchOutputSchema,
      'CoderBatchOutput'
    ));
  }

  writeCache(cacheDir, cacheKey, output);
  return output;
}

function loadItems(filteredDir) {
  return fs.readdirSync(filteredDir)
    .filter(f => f.endsWith('.json'))
    .map(filename => {
      const content = JSON.parse(fs.readFileSync(path.join(filteredDir, filename), 'utf-8'));
      return {
        source_file: filename,
        component_name: content.component_name || path.parse(filename).name,
        test_cases: content.test_cases || [],
        planner_output: content,
      };
    });
}

async function run(filteredDir, outputDir, baseUrl, cacheDir, options = {}) {
  const items = loadItems(filteredDir);
  if (items.length === 0) return { generated_count: 0, generated: [] };

  const prompt = loadPrompt('Coder');
  const coderCacheDir = path.join(cacheDir, 'coder');
  fs.mkdirSync(outputDir, { recursive: true });

  const maxWorkers = Math.min(AI_MAX_WORKERS, items.length) || 1;

  const outputs = await mapConcurrent(items, maxWorkers, async (item) => {
    try {
      return await generateOne(item, prompt, baseUrl, coderCacheDir);
    } catch (err) {
      console.error(`[Coder] Error generating spec for ${item.source_file}: ${err.message}`);
      return { generated: [] };
    }
  }, { onProgress: options.onProgress });

  const manifest = [];
  const usedNames = new Set();

  items.forEach((item, i) => {
    const output = outputs[i];
    if (!output) return;
    for (const gen of output.generated) {
      let specName = gen.spec_file;
      if (!specName.endsWith('.spec.ts')) {
        specName = `${sanitizeName(specName)}.spec.ts`;
      }
      if (usedNames.has(specName)) {
        const stem = sanitizeName(path.parse(item.source_file).name);
        specName = `${stem}_${specName}`;
      }
      usedNames.add(specName);

      fs.writeFileSync(
        path.join(outputDir, specName),
        gen.content.trimEnd() + '\n',
        'utf-8'
      );
      manifest.push({
        component_name: item.component_name,
        source_file: item.source_file,
        spec_file: specName,
        test_case_count: gen.test_case_count,
      });
    }
  });

  const result = {
    input: filteredDir,
    output_dir: outputDir,
    generated_count: manifest.length,
    generated: manifest,
  };

  fs.writeFileSync(path.join(outputDir, 'index.json'), JSON.stringify(result, null, 2), 'utf-8');
  return result;
}

module.exports = { run };
