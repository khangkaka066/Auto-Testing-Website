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

function nodeMajorVersion() {
  const match = process.version.match(/^v(\d+)/);
  return match ? Number(match[1]) : 0;
}

function getSpecFiles(specsDir) {
  if (!fs.existsSync(specsDir)) return [];
  return fs.readdirSync(specsDir)
    .filter(f => f.endsWith('.spec.ts'))
    .map(f => path.resolve(specsDir, f));
}

function runTsc(tscBin, specFiles) {
  return spawnSync(
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
}

function runTscVersion(tscBin) {
  return spawnSync(process.execPath, [tscBin, '--version'], {
    cwd: BACKEND_ROOT,
    encoding: 'utf-8',
  });
}

function resultLog(result) {
  const output = (result.stdout || '') + '\n' + (result.stderr || '');
  if (result.error) {
    return `${output}\n[validator] Failed to run TypeScript compiler: ${result.error.message}`;
  }
  if (result.signal) {
    return `${output}\n[validator] TypeScript compiler terminated by signal: ${result.signal}`;
  }
  return output;
}

function writeFailedSpecManifest(validatorOutputDir, failedFiles) {
  fs.writeFileSync(
    path.join(validatorOutputDir, 'failed_specs.json'),
    JSON.stringify({
      failed_count: failedFiles.length,
      failed: failedFiles,
    }, null, 2),
    'utf-8'
  );
}

function extractFailedSpecFilesFromLog(log, specsDir) {
  const specsDirResolved = path.resolve(specsDir);
  const rawMatches = [
    ...[...log.matchAll(/^(.+?\.spec\.ts)\(\d+,\d+\):/gm)].map(m => m[1]),
    ...[...log.matchAll(/^--- (.+?\.spec\.ts) ---$/gm)].map(m => m[1]),
    ...[...log.matchAll(/([^\n:(]+\.spec\.ts)/g)].map(m => m[1].trim()),
  ];
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

function run(specsDir, validatorOutputDir) {
  const specFiles = getSpecFiles(specsDir);
  fs.mkdirSync(validatorOutputDir, { recursive: true });
  if (specFiles.length === 0) {
    writeFailedSpecManifest(validatorOutputDir, []);
    return true;
  }

  const tscBin = resolveTscBin();
  if (!tscBin) {
    fs.writeFileSync(
      path.join(validatorOutputDir, 'validator_errors.log'),
      'TypeScript compiler is not installed in the backend package. Run `npm install` in backend/ before starting the pipeline.',
      'utf-8'
    );
    writeFailedSpecManifest(validatorOutputDir, []);
    return false;
  }

  if (nodeMajorVersion() < 20) {
    fs.writeFileSync(
      path.join(validatorOutputDir, 'validator_errors.log'),
      `Unsupported Node.js version for the AI pipeline validator: ${process.version}. Backend requires Node.js >=20.`,
      'utf-8'
    );
    writeFailedSpecManifest(validatorOutputDir, []);
    return false;
  }

  const tscVersion = runTscVersion(tscBin);
  if (tscVersion.status !== 0) {
    fs.writeFileSync(
      path.join(validatorOutputDir, 'validator_errors.log'),
      [
        'TypeScript compiler failed before spec validation could start.',
        resultLog(tscVersion).trim(),
      ].filter(Boolean).join('\n'),
      'utf-8'
    );
    writeFailedSpecManifest(validatorOutputDir, []);
    return false;
  }

  const result = runTsc(tscBin, specFiles);
  if (result.status === 0) {
    fs.rmSync(path.join(validatorOutputDir, 'validator_errors.log'), { force: true });
    writeFailedSpecManifest(validatorOutputDir, []);
    return true;
  }

  const errorLog = resultLog(result).trim();
  const failedFiles = extractFailedSpecFilesFromLog(errorLog, specsDir);
  fs.writeFileSync(path.join(validatorOutputDir, 'validator_errors.log'), errorLog, 'utf-8');
  writeFailedSpecManifest(validatorOutputDir, failedFiles);
  return false;
}

function getFailedSpecFiles(specsDir, validatorOutputDir) {
  const manifestPath = path.join(validatorOutputDir, 'failed_specs.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (Array.isArray(manifest.failed)) {
        return manifest.failed
          .map(fp => path.resolve(fp))
          .filter(fp => fs.existsSync(fp) && fp.endsWith('.spec.ts'))
          .sort();
      }
    } catch {
      // Fall back to parsing the TypeScript log below.
    }
  }

  const logPath = path.join(validatorOutputDir, 'validator_errors.log');
  if (!fs.existsSync(logPath)) return [];

  const log = fs.readFileSync(logPath, 'utf-8');
  return extractFailedSpecFilesFromLog(log, specsDir);
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
