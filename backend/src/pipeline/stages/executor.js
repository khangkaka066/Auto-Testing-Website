const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function parsePlaywrightOutput(stdout, stderr, returnCode) {
  const summary = {
    runner_version: '1.0',
    generated_at: new Date().toISOString(),
    status: returnCode === 0 ? 'passed' : 'failed',
    return_code: returnCode,
    stats: { total: 0, passed: 0, failed: 0, skipped: 0, timed_out: 0, duration_ms: 0 },
    test_cases: [],
    errors: [],
    stderr: (stderr || '').trim(),
  };

  if (!stdout || !stdout.trim()) return summary;

  // Find JSON in stdout
  const match = stdout.match(/\{\n\s*"config":/);
  const jsonStart = match ? stdout.indexOf(match[0]) : (stdout.trim().startsWith('{') ? 0 : -1);
  if (jsonStart === -1) return summary;

  let data;
  try {
    data = JSON.parse(stdout.slice(jsonStart));
  } catch {
    return summary;
  }

  const testCases = [];

  function walkSuite(suite, parentTitle = '', inheritedFile = '') {
    const suiteFile = suite.file || inheritedFile;
    const currentTitle = [parentTitle, suite.title].filter(Boolean).join(' > ');
    for (const spec of (suite.specs || [])) {
      const specTitle = [currentTitle, spec.title].filter(Boolean).join(' > ');
      for (const test of (spec.tests || [])) {
        const outcome = (test.outcome || 'unknown').toLowerCase();
        const durationMs = (test.results || []).reduce((s, r) => s + (r.duration || 0), 0);
        const errors = (test.results || [])
          .map(r => (r.error && r.error.message) || null)
          .filter(Boolean)
          .map(m => m.trim());
        testCases.push({ title: specTitle, file: suiteFile, status: outcome, duration_ms: durationMs, errors });
      }
    }
    for (const child of (suite.suites || [])) walkSuite(child, currentTitle, suiteFile);
  }

  for (const s of (data.suites || [])) walkSuite(s);

  const runnerErrors = (data.errors || [])
    .map(err => ({
      message: (err.message || '').trim(),
      stack: (err.stack || '').trim(),
    }))
    .filter(err => err.message || err.stack);

  const total = testCases.length;
  const failed = testCases.filter(t => t.errors.length > 0).length;
  const skipped = testCases.filter(t => t.status === 'skipped').length;
  const timedOut = testCases.filter(t => t.status === 'timedout').length;
  const durationMs = data.stats && data.stats.duration != null
    ? data.stats.duration
    : testCases.reduce((s, t) => s + t.duration_ms, 0);

  summary.stats = { total, passed: total - failed, failed, skipped, timed_out: timedOut, duration_ms: Math.round(durationMs) };
  summary.test_cases = testCases;
  summary.errors = runnerErrors;
  return summary;
}

function runCommand(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, options);
    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', chunk => {
        stdout += chunk.toString();
      });
    }
    if (child.stderr) {
      child.stderr.on('data', chunk => {
        stderr += chunk.toString();
      });
    }

    child.on('error', error => {
      resolve({ stdout, stderr, status: null, error });
    });
    child.on('close', status => {
      resolve({ stdout, stderr, status, error: null });
    });
  });
}

function writeRuntimeEnvFiles(workingDir, env) {
  const runtimeEnv = {
    BASE_URL: env.BASE_URL || '',
    FRONTEND_URL: env.FRONTEND_URL || env.BASE_URL || '',
    API_BASE_URL: env.API_BASE_URL || '',
    BACKEND_URL: env.BACKEND_URL || env.API_BASE_URL || '',
    PLAYWRIGHT_MANAGED_SERVICES: env.PLAYWRIGHT_MANAGED_SERVICES || '',
  };

  fs.writeFileSync(
    path.join(workingDir, 'testpilot-runtime-env.json'),
    JSON.stringify(runtimeEnv, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(workingDir, 'executor_env.json'),
    JSON.stringify(runtimeEnv, null, 2),
    'utf-8'
  );
}

async function run(specsDir, reportFile, workingDir, baseUrl, envOverrides = {}) {
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });

  const env = Object.assign({}, process.env, envOverrides);
  if (baseUrl) env.BASE_URL = baseUrl;
  if (env.BASE_URL && !env.FRONTEND_URL) env.FRONTEND_URL = env.BASE_URL;
  writeRuntimeEnvFiles(workingDir, env);
  const playwrightJsonPath = path.join(workingDir, 'playwright-report.json');

  const result = await runCommand(
    'npx',
    ['playwright', 'test'],
    {
      cwd: workingDir,
      env,
      shell: process.platform === 'win32',
    }
  );

  const rawStdout = result.stdout || '';
  const rawStderr = result.stderr || '';
  const returnCode = result.status == null ? 1 : result.status;
  const rawReport = fs.existsSync(playwrightJsonPath)
    ? fs.readFileSync(playwrightJsonPath, 'utf-8')
    : rawStdout;

  const summary = parsePlaywrightOutput(rawReport, rawStderr, returnCode);
  summary.specs_dir = specsDir;
  summary.playwright_report_path = fs.existsSync(playwrightJsonPath) ? playwrightJsonPath : null;

  if (!summary.playwright_report_path || summary.stats.total === 0) {
    summary.stdout = rawStdout.trim();
    summary.stderr = rawStderr.trim();
    summary.error = result.error ? result.error.message : null;
  }

  fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2), 'utf-8');
  return summary;
}

module.exports = { run };
