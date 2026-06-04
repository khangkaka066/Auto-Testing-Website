const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '../../..');

function resolveTscBin() {
  try {
    return require.resolve('typescript/bin/tsc', { paths: [BACKEND_ROOT] });
  } catch {
    return null;
  }
}

function getSpecFiles(specsDir) {
  if (!fs.existsSync(specsDir)) return [];
  return fs.readdirSync(specsDir)
    .filter(f => f.endsWith('.spec.ts'))
    .map(f => path.resolve(specsDir, f));
}

function run(specsDir, validatorOutputDir) {
  const specFiles = getSpecFiles(specsDir);
  if (specFiles.length === 0) return true;

  const tscBin = resolveTscBin();
  if (!tscBin) {
    fs.mkdirSync(validatorOutputDir, { recursive: true });
    fs.writeFileSync(
      path.join(validatorOutputDir, 'validator_errors.log'),
      'TypeScript compiler is not installed in the backend package. Run `npm install` in backend/ before starting the pipeline.',
      'utf-8'
    );
    return false;
  }

  const result = spawnSync(
    process.execPath,
    [
      tscBin,
      '--noEmit',
      '--target', 'es2022',
      '--module', 'esnext',
      '--moduleResolution', 'bundler',
      '--skipLibCheck',
      '--lib', 'es2022,dom',
      ...specFiles,
    ],
    { cwd: BACKEND_ROOT, encoding: 'utf-8' }
  );

  if (result.status === 0) return true;

  const errorLog = (result.stdout || '') + '\n' + (result.stderr || '');
  fs.mkdirSync(validatorOutputDir, { recursive: true });
  fs.writeFileSync(path.join(validatorOutputDir, 'validator_errors.log'), errorLog.trim(), 'utf-8');
  return false;
}

function getFailedSpecFiles(specsDir, validatorOutputDir) {
  const logPath = path.join(validatorOutputDir, 'validator_errors.log');
  if (!fs.existsSync(logPath)) return [];

  const log = fs.readFileSync(logPath, 'utf-8');
  const specsDirResolved = path.resolve(specsDir);

  const rawMatches = [...log.matchAll(/([^\s:(]+\.spec\.ts)/g)].map(m => m[1]);
  const failed = new Set();

  for (const raw of rawMatches) {
    const candidates = [
      path.resolve(raw),
      path.join(specsDirResolved, path.basename(raw)),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate) && candidate.endsWith('.spec.ts')) {
        const rel = path.relative(specsDirResolved, candidate);
        if (!rel.startsWith('..')) {
          failed.add(candidate);
          break;
        }
      }
    }
  }

  return [...failed].sort();
}

function removeFailedSpecs(specsDir, validatorOutputDir) {
  const failed = getFailedSpecFiles(specsDir, validatorOutputDir);
  if (failed.length === 0) return [];

  const removed = [];
  const skipped = [];
  for (const fp of failed) {
    try {
      fs.rmSync(fp, { force: true });
      removed.push(fp);
    } catch (err) {
      skipped.push({ file_path: fp, error: err.message });
    }
  }

  fs.writeFileSync(
    path.join(validatorOutputDir, 'removed_failed_specs.json'),
    JSON.stringify({ removed_count: removed.length, removed, skipped }, null, 2),
    'utf-8'
  );
  return removed;
}

module.exports = { run, getFailedSpecFiles, removeFailedSpecs };
