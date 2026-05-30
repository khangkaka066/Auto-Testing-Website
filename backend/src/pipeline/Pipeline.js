const fs = require('fs');
const path = require('path');
const { WORKSPACE_BASE_PATH } = require('../config/env');

const detector  = require('./stages/detector');
const analyzer  = require('./stages/analyzer');
const planner   = require('./stages/planner');
const filter    = require('./stages/filter');
const coder     = require('./stages/coder');
const validator = require('./stages/validator');
const debugger_ = require('./stages/debugger');
const executor  = require('./stages/executor');
const reporter  = require('./stages/reporter');

const PROGRESS_STAGES = [
  { key: 'detector', label: 'Scanning project files', percent: 18 },
  { key: 'analyzer', label: 'Analyzing source code', percent: 32 },
  { key: 'planner', label: 'Planning test cases', percent: 46 },
  { key: 'filter', label: 'Filtering test candidates', percent: 56 },
  { key: 'coder', label: 'Generating Playwright tests', percent: 68 },
  { key: 'validator', label: 'Validating generated tests', percent: 78 },
  { key: 'debugger', label: 'Repairing generated tests when needed', percent: 84 },
  { key: 'executor', label: 'Running Playwright tests', percent: 92 },
  { key: 'reporter', label: 'Preparing final report', percent: 97 },
];

const STAGE_INDEX = PROGRESS_STAGES.reduce((acc, stage, index) => {
  acc[stage.key] = index;
  return acc;
}, {});

function safeName(value, fallback = 'project') {
  return String(value || '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[._-]+|[._-]+$/g, '') || fallback;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function buildRunId(sourceCodePath) {
  const now = new Date();
  const timestamp = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}_${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
  const projectName = safeName(path.basename(sourceCodePath), 'project');
  return `run_${timestamp}_${projectName}`;
}

function buildUniqueRunWorkspace(baseDir, runId) {
  let candidateRunId = runId;
  let candidateDir = path.join(baseDir, candidateRunId);
  let counter = 1;
  while (fs.existsSync(candidateDir)) {
    candidateRunId = `${runId}_${counter}`;
    candidateDir = path.join(baseDir, candidateRunId);
    counter += 1;
  }
  return { runId: candidateRunId, runWorkspaceDir: candidateDir };
}

class Pipeline {
  constructor({ userId, projectId, sourceCodePath, onProgress }) {
    this.userId = userId;
    this.projectId = projectId;
    this.sourceCodePath = sourceCodePath;
    this.onProgress = typeof onProgress === 'function' ? onProgress : () => {};

    const base = path.resolve(WORKSPACE_BASE_PATH);
    const userWorkspaceDir = path.join(base, safeName(userId, 'user'));
    const runBaseDir = path.join(userWorkspaceDir, 'runs');
    const runWorkspace = buildUniqueRunWorkspace(runBaseDir, buildRunId(sourceCodePath));

    this.runId = runWorkspace.runId;
    this.runWorkspaceDir = runWorkspace.runWorkspaceDir;
    this.cacheDir        = path.join(userWorkspaceDir, '.ai_cache');
    this.specsDir        = path.join(this.runWorkspaceDir, 'tests');

    this.dirs = {
      detector:  path.join(this.runWorkspaceDir, '1_detector'),
      analyzer:  path.join(this.runWorkspaceDir, '2_analyzer'),
      planner:   path.join(this.runWorkspaceDir, '3_planner'),
      filter:    path.join(this.runWorkspaceDir, '4_filter'),
      coder:     path.join(this.runWorkspaceDir, '5_coder'),
      validator: path.join(this.runWorkspaceDir, '5.5_validator'),
      executor:  path.join(this.runWorkspaceDir, '6_executor'),
      reporter:  path.join(this.runWorkspaceDir, '7_reporter'),
    };

    this._setupDirectories();
  }

  _reportProgress(stageKey, message, currentItem) {
    const index = STAGE_INDEX[stageKey] == null ? 0 : STAGE_INDEX[stageKey];
    const stage = PROGRESS_STAGES[index];
    const completed = Math.min(index + 1, PROGRESS_STAGES.length);
    this.onProgress({
      status: 'running',
      stage: stageKey,
      progress_percent: stage.percent,
      message,
      sub_progress: {
        label: stage.label,
        completed,
        total: PROGRESS_STAGES.length,
        percent: Math.round((completed / PROGRESS_STAGES.length) * 100),
        current_item: currentItem || path.basename(this.sourceCodePath),
      },
    });
  }

  _setupDirectories() {
    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.mkdirSync(this.specsDir, { recursive: true });
    for (const dir of Object.values(this.dirs)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const templateConfig = path.join(__dirname, '..', '..', 'playwright.config.ts');
    const destConfig = path.join(this.runWorkspaceDir, 'playwright.config.ts');
    if (fs.existsSync(templateConfig)) fs.copyFileSync(templateConfig, destConfig);
  }

  // ── Stage runners ──────────────────────────────────────────────

  async runDetector() {
    this._reportProgress('detector', 'Scanning project files and folders', path.basename(this.sourceCodePath));
    console.log('[STAGE 1] Detector...');
    const results = detector.run(this.sourceCodePath);
    const outPath = path.join(this.dirs.detector, 'detector_results.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`  → ${results.source_files.length} source files found`);
    return outPath;
  }

  async runAnalyzer(detectorResultsPath) {
    this._reportProgress('analyzer', 'Analyzing source files with AI', 'Reading detected source files');
    console.log('[STAGE 2] Analyzer...');
    await analyzer.run(this.sourceCodePath, detectorResultsPath, this.dirs.analyzer, this.cacheDir);
  }

  async runPlanner(testType = 'UI Testing') {
    this._reportProgress('planner', 'Building an executable test plan', testType);
    console.log('[STAGE 3] Planner...');
    await planner.run(this.dirs.analyzer, this.dirs.planner, this.cacheDir, testType);
  }

  runFilter() {
    this._reportProgress('filter', 'Selecting test cases that can be generated safely', 'Filtering planner output');
    console.log('[STAGE 3.5] Filter...');
    filter.run(this.dirs.planner, this.dirs.filter);
  }

  async runCoder(baseUrl) {
    this._reportProgress('coder', 'Generating Playwright test files', baseUrl);
    console.log('[STAGE 4] Coder...');
    const manifest = await coder.run(this.dirs.filter, this.specsDir, baseUrl, this.cacheDir);
    fs.writeFileSync(
      path.join(this.dirs.coder, 'coder_manifest.json'),
      JSON.stringify(manifest, null, 2), 'utf-8'
    );
    return manifest;
  }

  runValidator() {
    this._reportProgress('validator', 'Checking generated tests before execution', 'TypeScript validation');
    console.log('[STAGE 4.5] Validator...');
    return validator.run(this.specsDir, this.dirs.validator);
  }

  async runDebugger() {
    this._reportProgress('debugger', 'Checking whether generated tests need repair', 'Validation results');
    console.log('[STAGE 4.7] Debugger...');
    const failedFiles = validator.getFailedSpecFiles(this.specsDir, this.dirs.validator);
    if (failedFiles.length === 0) return;

    const logPath = path.join(this.dirs.validator, 'validator_errors.log');
    const errorLog = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8') : '';
    const manifestPath = path.join(this.dirs.coder, 'coder_manifest.json');
    this._reportProgress('debugger', 'Repairing generated tests', `${failedFiles.length} file(s) need repair`);
    await debugger_.run(failedFiles, errorLog, manifestPath, this.dirs.filter, this.dirs.validator);
  }

  runExecutor(baseUrl) {
    this._reportProgress('executor', 'Running generated tests in Playwright', baseUrl);
    console.log('[STAGE 5] Executor...');
    const specFiles = fs.existsSync(this.specsDir)
      ? fs.readdirSync(this.specsDir).filter(f => f.endsWith('.spec.ts'))
      : [];
    if (specFiles.length === 0) return null;

    const detectorPath = path.join(this.dirs.detector, 'detector_results.json');
    if (fs.existsSync(detectorPath)) {
      const infra = JSON.parse(fs.readFileSync(detectorPath, 'utf-8')).infrastructure;
      const frontend = infra.projects.find(p =>
        p.project_name.toLowerCase() === 'frontend' ||
        ['client', 'frontend'].includes(p.root_path.split('/').pop().toLowerCase())
      );
      if (frontend) process.env.FRONTEND_DIR = path.resolve(frontend.root_path);
    }

    const reportFile = path.join(this.dirs.executor, 'test_report.json');
    return executor.run(this.specsDir, reportFile, this.runWorkspaceDir, baseUrl);
  }

  async runReporter() {
    const executorJsonPath = path.join(this.dirs.executor, 'test_report.json');
    if (!fs.existsSync(executorJsonPath)) return null;
    this._reportProgress('reporter', 'Summarizing test results for the report', 'Final report');
    console.log('[STAGE 6] Reporter...');
    return reporter.run(executorJsonPath, this.dirs.reporter);
  }

  // ── Orchestrate all stages ──────────────────────────────────────

  async execute(baseUrl) {
    console.log('\n=== AI PIPELINE STARTED ===');

    const detectorOut = await this.runDetector();
    await this.runAnalyzer(detectorOut);
    await this.runPlanner('UI Testing');
    this.runFilter();
    await this.runCoder(baseUrl);

    const MAX_RETRIES = 3;
    let isValid = this.runValidator();

    for (let attempt = 1; attempt <= MAX_RETRIES && !isValid; attempt++) {
      console.log(`\n--- Auto-healing attempt ${attempt}/${MAX_RETRIES} ---`);
      await this.runDebugger();
      isValid = this.runValidator();
    }

    if (!isValid) {
      console.log('[FALLBACK] Removing failed specs...');
      const removed = validator.removeFailedSpecs(this.specsDir, this.dirs.validator);
      if (removed.length > 0) isValid = true;
    }

    if (isValid) {
      const remaining = fs.existsSync(this.specsDir)
        ? fs.readdirSync(this.specsDir).filter(f => f.endsWith('.spec.ts'))
        : [];

      if (remaining.length === 0) {
        console.log('[FAILED] No valid spec files remaining.');
      } else {
        this.runExecutor(baseUrl);
        await this.runReporter();
      }
    } else {
      console.log('[FAILED] Pipeline failed after max retries.');
    }

    console.log('=== AI PIPELINE COMPLETED ===\n');
  }

  loadFinalReport() {
    const finalReportPath  = path.join(this.dirs.reporter, 'final_report.json');
    const executorReportPath = path.join(this.dirs.executor, 'test_report.json');
    return {
      run_workspace_dir:    this.runWorkspaceDir,
      final_report_path:   fs.existsSync(finalReportPath)   ? finalReportPath   : null,
      executor_report_path: fs.existsSync(executorReportPath) ? executorReportPath : null,
      final_report: fs.existsSync(finalReportPath)
        ? JSON.parse(fs.readFileSync(finalReportPath, 'utf-8'))
        : null,
    };
  }
}

module.exports = Pipeline;
