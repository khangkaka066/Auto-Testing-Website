const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');
const { optimizeCodeForLLM } = require('../../lib/astParser');
const { AI_MAX_WORKERS } = require('../../config/env');

const UIElementSchema = z.object({
  element_type: z.string(),
  selector: z.string(),
  purpose: z.string(),
});

const APIEndpointSchema = z.object({
  function_name: z.string(),
  method: z.string().default('GET'),
  route_or_target: z.string(),
  required_payload_fields: z.array(z.string()).default([]),
});

const TechnicalAnalysisOutputSchema = z.object({
  component_name: z.string(),
  module_type: z.string(),
  impact_level: z.string(),
  interactive_elements: z.array(UIElementSchema).default([]),
  extracted_endpoints: z.array(APIEndpointSchema).default([]),
  dependencies: z.array(z.string()).default([]),
  has_conditional_rendering: z.boolean().default(false),
});

async function analyzeFile(workspaceDir, fileInfo, prompt, cacheDir) {
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
  });

  const cached = readCache(cacheDir, cacheKey);
  if (cached) return { ...cached, file_path: fileInfo.file_path };

  const userPrompt = `Language: ${fileInfo.language}\nSource Code:\n\`\`\`\n${optimized}\n\`\`\``;
  const result = await parseStructured(
    prompt.model,
    prompt.systemPrompt,
    userPrompt,
    TechnicalAnalysisOutputSchema,
    'TechnicalAnalysisOutput'
  );

  const data = { ...result, file_path: fileInfo.file_path };
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

async function run(workspaceDir, detectorResultsPath, outputDir, cacheDir) {
  const detectorData = JSON.parse(fs.readFileSync(detectorResultsPath, 'utf-8'));
  const filesToAnalyze = detectorData.source_files || [];
  if (filesToAnalyze.length === 0) return;

  const prompt = loadPrompt('Analyzer');
  const analyzerCacheDir = path.join(cacheDir, 'analyzer');

  const maxWorkers = Math.min(AI_MAX_WORKERS, filesToAnalyze.length) || 1;

  const results = await pLimit(filesToAnalyze, maxWorkers, async (fileInfo) => {
    try {
      return await analyzeFile(workspaceDir, fileInfo, prompt, analyzerCacheDir);
    } catch (err) {
      console.error(`[Analyzer] Error processing ${fileInfo.file_path}: ${err.message}`);
      return null;
    }
  });

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
