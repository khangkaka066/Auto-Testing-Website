const fs = require('fs');
const path = require('path');
const { loadPrompt, createCompletion } = require('../../lib/openai');
const { AI_MAX_WORKERS } = require('../../config/env');
const { mapConcurrent } = require('../../lib/concurrency');

async function fixFile(filePath, errorLog, testPlanContent, prompt) {
  if (!fs.existsSync(filePath)) {
    return { file_path: filePath, status: 'skipped', reason: 'File not found.' };
  }

  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    const userPrompt = `[TSC ERROR LOG]:\n${errorLog}\n\n[TEST PLAN CONTEXT]:\n${testPlanContent}\n\n[CURRENT SOURCE CODE]:\n${code}`;

    const fixedCode = await createCompletion(prompt.model, prompt.systemPrompt, userPrompt);
    fs.writeFileSync(filePath, fixedCode, 'utf-8');
    return { file_path: filePath, status: 'fixed', reason: '' };
  } catch (err) {
    return { file_path: filePath, status: 'failed', reason: err.message };
  }
}

async function run(failedFiles, errorLog, coderManifestPath, filterDir, validatorOutputDir, options = {}) {
  if (failedFiles.length === 0) return;

  const specToPlanMap = {};
  if (coderManifestPath && fs.existsSync(coderManifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(coderManifestPath, 'utf-8'));
    const specsDir = path.dirname(path.dirname(coderManifestPath)); // run_workspace/tests
    for (const item of (manifest.generated || [])) {
      const specFullPath = path.resolve(path.join(specsDir, 'tests', item.spec_file));
      specToPlanMap[specFullPath] = item.source_file;
    }
  }

  const errorLines = errorLog.split('\n');

  function getTestPlanForSpec(filePath) {
    const planFilename = specToPlanMap[filePath];
    if (!planFilename) return 'Test plan not found.';
    const planPath = path.join(filterDir, planFilename);
    if (!fs.existsSync(planPath)) return 'Test plan not found.';
    try {
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf-8'));
      const cases = plan.test_cases || [];
      return cases.length > 0 ? JSON.stringify(cases, null, 2) : 'No test cases in plan.';
    } catch {
      return 'Could not read test plan.';
    }
  }

  function getFileSpecificLog(filePath) {
    const basename = path.basename(filePath);
    const matching = errorLines.filter(l => l.includes(filePath) || l.includes(basename));
    return matching.length > 0 ? matching.join('\n') : errorLog;
  }

  const prompt = loadPrompt('Debugger');
  const maxWorkers = Math.min(AI_MAX_WORKERS, failedFiles.length) || 1;

  const results = await mapConcurrent(failedFiles, maxWorkers, async (filePath) => {
    return fixFile(
      filePath,
      getFileSpecificLog(filePath),
      getTestPlanForSpec(filePath),
      prompt
    );
  }, {
    onProgress: options.onProgress,
    onError: (err) => ({
      status: 'failed',
      reason: err && err.message ? err.message : 'Unknown error',
    }),
  });

  fs.writeFileSync(
    path.join(validatorOutputDir, 'debugger_results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
}

module.exports = { run };
