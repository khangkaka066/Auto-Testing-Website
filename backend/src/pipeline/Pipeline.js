const fs = require('fs');
const path = require('path');
const { WORKSPACE_BASE_PATH, TARGET_BASE_URL } = require('../config/env');
const { runWithTracking } = require('../lib/tokenTracker');

const detector  = require('./stages/detector');
const analyzer  = require('./stages/analyzer');
const planner   = require('./stages/planner');
const filter    = require('./stages/filter');
const coder     = require('./stages/coder');
const validator = require('./stages/validator');
const debugger_ = require('./stages/debugger');
const executor  = require('./stages/executor');
const reporter  = require('./stages/reporter');
const { startRuntimeServices } = require('./runtime/serviceManager');
const { enrichInfrastructureWithAI } = require('./runtime/backendInference');
const { bootstrapDatabases } = require('./runtime/dbBootstrap');
const { buildFrameworkProfile } = require('../lib/frameworkProfile');

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

function pipelineError(message, details = {}) {
  const err = new Error(message);
  err.name = 'PipelineError';
  err.details = details;
  return err;
}

class Pipeline {
  constructor({ userId, projectId, sourceCodePath, testType, onProgress }) {
    this.userId = userId;
    this.projectId = projectId;
    this.sourceCodePath = sourceCodePath;
    this.testType = testType || 'UI Testing';
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
    this.infrastructure    = null;
    this.frameworkProfile  = null;
    this.runtimeUrls       = {};
    this.dbEnvs            = {};
    this._stopDbs          = () => {};
  }

  _reportProgress(stageKey, message) {
    const index = STAGE_INDEX[stageKey] == null ? 0 : STAGE_INDEX[stageKey];
    const stage = PROGRESS_STAGES[index];
    return this.onProgress({
      status: 'running',
      stage: stageKey,
      progress_percent: stage.percent,
      message,
      sub_progress: null,
    });
  }

  _reportSubProgress(stageKey, label, completed, total) {
    if (!total || total <= 0) return null;
    const index = STAGE_INDEX[stageKey] == null ? 0 : STAGE_INDEX[stageKey];
    const stage = PROGRESS_STAGES[index];
    const safeCompleted = Math.max(0, Math.min(completed, total));
    return this.onProgress({
      status: 'running',
      stage: stageKey,
      progress_percent: stage.percent,
      sub_progress: {
        label,
        completed: safeCompleted,
        total,
        percent: Math.round((safeCompleted / total) * 100),
      },
    });
  }

  async _waitForProgressPersist(progressResult) {
    if (progressResult && progressResult.persisted) {
      await progressResult.persisted;
    }
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
    this._reportProgress('detector', 'Scanning project files and folders');
    console.log('[STAGE 1] Detector...');
    const results = detector.run(this.sourceCodePath);
    this.infrastructure   = results.infrastructure || null;
    this.frameworkProfile = buildFrameworkProfile(this.infrastructure);
    if (this.frameworkProfile) {
      console.log(`  → Framework detected: ${this.frameworkProfile.detected_framework}`);
    }
    const outPath = path.join(this.dirs.detector, 'detector_results.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`  → ${results.source_files.length} source files found`);
    return outPath;
  }

  async runBackendInference(detectorResultsPath) {
    if (!this.infrastructure) return;
    const needsInference = (this.infrastructure.projects || []).some(
      p => p.type === 'backend' && p.run_config && (!p.run_config.start_command || p.run_config.confidence === 'low')
    );
    if (!needsInference) return;

    console.log('[STAGE 1.5] Backend Inference...');
    this.infrastructure = await enrichInfrastructureWithAI(this.infrastructure, this.cacheDir);

    // Patch detector_results.json so executor re-reads the corrected infrastructure
    if (fs.existsSync(detectorResultsPath)) {
      const existing = JSON.parse(fs.readFileSync(detectorResultsPath, 'utf-8'));
      existing.infrastructure = this.infrastructure;
      fs.writeFileSync(detectorResultsPath, JSON.stringify(existing, null, 2), 'utf-8');
    }
  }

  async runDbBootstrap() {
    if (!this.infrastructure) return;
    const needsDb = (this.infrastructure.projects || []).some(
      p => p.type === 'backend' && p.requires_database && (p.database_types || []).length > 0
    );
    if (!needsDb) return;

    console.log('[STAGE 1.8] DB Bootstrap...');
    const dbLogsDir = path.join(this.dirs.detector, 'db_logs');
    const result = await bootstrapDatabases(
      this.infrastructure,
      this.cacheDir,
      dbLogsDir,
      this.runId
    );
    this.dbEnvs = result.dbEnvsByProject;
    this._stopDbs = result.stop;
  }

  async runAnalyzer(detectorResultsPath) {
    this._reportProgress('analyzer', 'Analyzing source files with AI');
    console.log('[STAGE 2] Analyzer...');
    await analyzer.run(this.sourceCodePath, detectorResultsPath, this.dirs.analyzer, this.cacheDir, {
      onProgress: ({ completed, total }) => {
        this._reportSubProgress('analyzer', 'Analyzing source files', completed, total);
      },
    }, this.frameworkProfile);
  }

  async runPlanner(testType = 'UI Testing') {
    this._reportProgress('planner', 'Building an executable test plan');
    console.log('[STAGE 3] Planner...');
    await planner.run(this.dirs.analyzer, this.dirs.planner, this.cacheDir, testType, {
      onProgress: ({ completed, total }) => {
        this._reportSubProgress('planner', 'Planning analyzed files', completed, total);
      },
    }, this.frameworkProfile);
  }

  runFilter() {
    this._reportProgress('filter', 'Selecting test cases that can be generated safely');
    console.log('[STAGE 3.5] Filter...');
    filter.run(this.dirs.planner, this.dirs.filter, { analyzerDir: this.dirs.analyzer });
  }

  async runCoder(baseUrl) {
    this._reportProgress('coder', 'Generating Playwright test files');
    console.log('[STAGE 4] Coder...');
    const manifest = await coder.run(this.dirs.filter, this.specsDir, baseUrl, this.cacheDir, {
      testType: this.testType,
      analyzerDir: this.dirs.analyzer,
      runtimeUrls: this.runtimeUrls,
      frameworkProfile: this.frameworkProfile,
      onProgress: ({ completed, total }) => {
        return this._reportSubProgress('coder', 'Generating test specs', completed, total);
      },
    });
    fs.writeFileSync(
      path.join(this.dirs.coder, 'coder_manifest.json'),
      JSON.stringify(manifest, null, 2), 'utf-8'
    );
    return manifest;
  }

  async runValidator() {
    await this._waitForProgressPersist(
      this._reportProgress('validator', 'Checking generated tests before execution')
    );
    console.log('[STAGE 4.5] Validator...');
    return validator.run(this.specsDir, this.dirs.validator);
  }

  async runDebugger() {
    await this._waitForProgressPersist(
      this._reportProgress('debugger', 'Checking whether generated tests need repair')
    );
    console.log('[STAGE 4.7] Debugger...');
    const failedFiles = validator.getFailedSpecFiles(this.specsDir, this.dirs.validator);
    if (failedFiles.length === 0) return;

    const logPath = path.join(this.dirs.validator, 'validator_errors.log');
    const errorLog = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8') : '';
    const manifestPath = path.join(this.dirs.coder, 'coder_manifest.json');
    await this._waitForProgressPersist(
      this._reportProgress('debugger', `Repairing ${failedFiles.length} generated test file(s)`)
    );
    await debugger_.run(failedFiles, errorLog, manifestPath, this.dirs.filter, this.dirs.validator, {
      onProgress: ({ completed, total }) => {
        return this._reportSubProgress('debugger', 'Repairing generated tests', completed, total);
      },
    });
  }

  async runExecutor(baseUrl) {
    this._reportProgress('executor', 'Running generated tests in Playwright');
    console.log('[STAGE 5] Executor...');
    const specFiles = fs.existsSync(this.specsDir)
      ? fs.readdirSync(this.specsDir).filter(f => f.endsWith('.spec.ts'))
      : [];
    if (specFiles.length === 0) return null;

    const detectorPath = path.join(this.dirs.detector, 'detector_results.json');
    let detectedBaseUrl = null;
    let infrastructure = this.infrastructure;
    if (fs.existsSync(detectorPath)) {
      const infra = JSON.parse(fs.readFileSync(detectorPath, 'utf-8')).infrastructure;
      infrastructure = infrastructure || infra;
      const frontend = (infra.projects || []).find(p =>
        p.type === 'frontend' &&
        p.run_config &&
        p.run_config.start_command &&
        p.run_config.url
      ) || (infra.projects || []).find(p =>
        p.project_name.toLowerCase() === 'frontend' ||
        ['client', 'frontend'].includes(p.root_path.split('/').pop().toLowerCase())
      );
      if (frontend) {
        if (frontend.run_config) {
          detectedBaseUrl = frontend.run_config.url || null;
        }
      }
    }

    const reportFile = path.join(this.dirs.executor, 'test_report.json');
    const executorBaseUrl = baseUrl && baseUrl !== TARGET_BASE_URL ? baseUrl : (detectedBaseUrl || baseUrl);
    // Merge DB env vars for the backend project (if bootstrapped)
    const backendProject = (infrastructure.projects || []).find(p => p.type === 'backend');
    const extraBackendEnv = backendProject ? (this.dbEnvs[backendProject.project_name] || {}) : {};

    const runtime = await startRuntimeServices(infrastructure, this.dirs.executor, extraBackendEnv);
    const finalBaseUrl = runtime.env.BASE_URL || executorBaseUrl;
    try {
      return await executor.run(this.specsDir, reportFile, this.runWorkspaceDir, finalBaseUrl, runtime.env);
    } finally {
      await runtime.stop();
      this._stopDbs();
    }
  }

  async runReporter() {
    const executorJsonPath = path.join(this.dirs.executor, 'test_report.json');
    if (!fs.existsSync(executorJsonPath)) return null;
    this._reportProgress('reporter', 'Summarizing test results for the report');
    console.log('[STAGE 6] Reporter...');
    return reporter.run(executorJsonPath, this.dirs.reporter);
  }

  // ── Orchestrate all stages ──────────────────────────────────────

  async execute(baseUrl) {
    console.log('\n=== AI PIPELINE STARTED ===');

    // runWithTracking tự đo tổng tokens tiêu thụ trong toàn bộ pipeline
    const tokenResult = await runWithTracking(async () => {
      const detectorOut = await this.runDetector();
      await this.runBackendInference(detectorOut);
      await this.runDbBootstrap();
      this.runtimeUrls = buildRuntimeUrls(this.infrastructure, baseUrl);
      await this.runAnalyzer(detectorOut);
      await this.runPlanner(this.testType);
      this.runFilter();
      await this.runCoder(this.runtimeUrls.baseUrl || baseUrl);

      const MAX_RETRIES = 3;
      let isValid = await this.runValidator();

      for (let attempt = 1; attempt <= MAX_RETRIES && !isValid; attempt++) {
        console.log(`\n--- Auto-healing attempt ${attempt}/${MAX_RETRIES} ---`);
        await this.runDebugger();
        isValid = await this.runValidator();
      }

      if (!isValid) {
        console.log('[FALLBACK] Removing failed specs...');
        const removed = validator.removeFailedSpecs(this.specsDir, this.dirs.validator);
        console.log(`  → Removed ${removed.length} failed spec file(s).`);
        if (removed.length > 0) isValid = true;
      }

      if (isValid) {
        const remaining = fs.existsSync(this.specsDir)
          ? fs.readdirSync(this.specsDir).filter(f => f.endsWith('.spec.ts'))
          : [];
        if (remaining.length === 0) {
          console.log('[FAILED] No valid spec files remaining.');
          throw pipelineError('No valid generated spec files remaining after validation.', {
            stage: 'validator',
            run_workspace_dir: this.runWorkspaceDir,
            validator_errors_path: path.join(this.dirs.validator, 'validator_errors.log'),
            removed_failed_specs_path: path.join(this.dirs.validator, 'removed_failed_specs.json'),
          });
        } else {
          await this.runExecutor(baseUrl);
          const report = await this.runReporter();
          if (!report) {
            throw pipelineError('Executor did not produce a report that can be summarized.', {
              stage: 'executor',
              run_workspace_dir: this.runWorkspaceDir,
              executor_report_path: path.join(this.dirs.executor, 'test_report.json'),
              runtime_services_path: path.join(this.dirs.executor, 'runtime_services.json'),
            });
          }
        }
      } else {
        console.log('[FAILED] Pipeline failed after max retries.');
        throw pipelineError('Generated specs failed validation after max auto-healing retries.', {
          stage: 'validator',
          run_workspace_dir: this.runWorkspaceDir,
          validator_errors_path: path.join(this.dirs.validator, 'validator_errors.log'),
          failed_specs_path: path.join(this.dirs.validator, 'failed_specs.json'),
        });
      }
    });

    this.tokensUsed   = tokenResult.total;
    this.inputTokens  = tokenResult.input;
    this.outputTokens = tokenResult.output;

    // gpt-5-nano pricing (update if model changes)
    const PRICE_INPUT  = 1.10 / 1_000_000; // $1.10 per 1M input tokens
    const PRICE_OUTPUT = 4.40 / 1_000_000; // $4.40 per 1M output tokens
    this.costUsd = this.inputTokens * PRICE_INPUT + this.outputTokens * PRICE_OUTPUT;

    console.log(`=== AI PIPELINE COMPLETED — input: ${this.inputTokens}, output: ${this.outputTokens}, total: ${this.tokensUsed}, cost: $${this.costUsd.toFixed(6)} ===\n`);
  }

  loadFinalReport() {
    const finalReportPath  = path.join(this.dirs.reporter, 'final_report.json');
    const executorReportPath = path.join(this.dirs.executor, 'test_report.json');
    const runtimeServicesPath = path.join(this.dirs.executor, 'runtime_services.json');
    return {
      run_workspace_dir:    this.runWorkspaceDir,
      final_report_path:   fs.existsSync(finalReportPath)   ? finalReportPath   : null,
      executor_report_path: fs.existsSync(executorReportPath) ? executorReportPath : null,
      runtime_services_path: fs.existsSync(runtimeServicesPath) ? runtimeServicesPath : null,
      final_report: fs.existsSync(finalReportPath)
        ? JSON.parse(fs.readFileSync(finalReportPath, 'utf-8'))
        : null,
    };
  }
}

function buildRuntimeUrls(infrastructure, fallbackBaseUrl) {
  const projects = infrastructure && Array.isArray(infrastructure.projects)
    ? infrastructure.projects
    : [];
  const frontend = projects.find(project => project.type === 'frontend' && project.run_config && project.run_config.url);
  const backend = projects.find(project => project.type === 'backend' && project.run_config && project.run_config.url);
  return {
    baseUrl: (frontend && frontend.run_config.url) || fallbackBaseUrl || null,
    apiBaseUrl: (backend && backend.run_config.url) || null,
    backendUrl: (backend && backend.run_config.url) || null,
  };
}

module.exports = Pipeline;
