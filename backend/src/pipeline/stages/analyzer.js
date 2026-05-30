const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { loadPrompt, parseStructured } = require('../../lib/openai');
const { stableHash, readCache, writeCache } = require('../../lib/cache');
const { optimizeCodeForLLM } = require('../../lib/astParser');
const { AI_MAX_WORKERS } = require('../../config/env');
const { mapConcurrent } = require('../../lib/concurrency');

const ANALYZER_FILE_LIMIT = 15;

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

  const data = { ...normalizeAnalysis(result), file_path: fileInfo.file_path };
  writeCache(cacheDir, cacheKey, data);
  return data;
}

async function run(workspaceDir, detectorResultsPath, outputDir, cacheDir, options = {}) {
  const detectorData = JSON.parse(fs.readFileSync(detectorResultsPath, 'utf-8'));
  const filesToAnalyze = (detectorData.source_files || []).slice(0, ANALYZER_FILE_LIMIT);
  if (filesToAnalyze.length === 0) return;

  const prompt = loadPrompt('Analyzer');
  const analyzerCacheDir = path.join(cacheDir, 'analyzer');

  const maxWorkers = Math.min(AI_MAX_WORKERS, filesToAnalyze.length) || 1;

  const results = await mapConcurrent(filesToAnalyze, maxWorkers, async (fileInfo) => {
    try {
      return await analyzeFile(workspaceDir, fileInfo, prompt, analyzerCacheDir);
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
