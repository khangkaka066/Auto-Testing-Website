const fs = require('fs');
const path = require('path');
const { WORKSPACE_BASE_PATH } = require('../config/env');
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

class Pipeline {
  constructor({ userId, projectId, sourceCodePath }) {
    this.userId = userId;
    this.projectId = projectId;
    this.sourceCodePath = sourceCodePath;

    this.runId = `run_${Date.now()}`;

    const base = path.resolve(WORKSPACE_BASE_PATH);
    this.runWorkspaceDir = path.join(base, userId, projectId, 'runs', this.runId);
    this.cacheDir        = path.join(base, userId, projectId, '.ai_cache');
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
    console.log('[STAGE 1] Detector...');
    const results = detector.run(this.sourceCodePath);
    const outPath = path.join(this.dirs.detector, 'detector_results.json');
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`  → ${results.source_files.length} source files found`);
    return outPath;
  }

  async runAnalyzer(detectorResultsPath) {
    console.log('[STAGE 2] Analyzer...');
    await analyzer.run(this.sourceCodePath, detectorResultsPath, this.dirs.analyzer, this.cacheDir);
  }

  async runPlanner(testType = 'UI Testing') {
    console.log('[STAGE 3] Planner...');
    await planner.run(this.dirs.analyzer, this.dirs.planner, this.cacheDir, testType);
  }

  runFilter() {
    console.log('[STAGE 3.5] Filter...');
    filter.run(this.dirs.planner, this.dirs.filter);
  }

  async runCoder(baseUrl) {
    console.log('[STAGE 4] Coder...');
    const manifest = await coder.run(this.dirs.filter, this.specsDir, baseUrl, this.cacheDir);
    fs.writeFileSync(
      path.join(this.dirs.coder, 'coder_manifest.json'),
      JSON.stringify(manifest, null, 2), 'utf-8'
    );
    return manifest;
  }

  runValidator() {
    console.log('[STAGE 4.5] Validator...');
    return validator.run(this.specsDir, this.dirs.validator);
  }

  async runDebugger() {
    console.log('[STAGE 4.7] Debugger...');
    const failedFiles = validator.getFailedSpecFiles(this.specsDir, this.dirs.validator);
    if (failedFiles.length === 0) return;

    const logPath = path.join(this.dirs.validator, 'validator_errors.log');
    const errorLog = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8') : '';
    const manifestPath = path.join(this.dirs.coder, 'coder_manifest.json');
    await debugger_.run(failedFiles, errorLog, manifestPath, this.dirs.filter, this.dirs.validator);
  }

  runExecutor(baseUrl) {
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
    console.log('[STAGE 6] Reporter...');
    return reporter.run(executorJsonPath, this.dirs.reporter);
  }

  // ── Orchestrate all stages ──────────────────────────────────────

  async execute(baseUrl) {
    console.log('\n=== AI PIPELINE STARTED ===');

    // runWithTracking tự đo tổng tokens tiêu thụ trong toàn bộ pipeline
    this.tokensUsed = await runWithTracking(async () => {
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
    });

    console.log(`=== AI PIPELINE COMPLETED — tokens used: ${this.tokensUsed} ===\n`);
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
