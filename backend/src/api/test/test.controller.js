const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');
const { createJob, updateJob, getJobByProject, getJob } = require('../../lib/jobStore');
const Pipeline = require('../../pipeline/Pipeline');
const { addUserTokens } = require('../../lib/tokenTracker');
const {
  WORKSPACE_BASE_PATH,
  TARGET_BASE_URL,
  AI_DEBUG,
} = require('../../config/env');

// In-memory test history
const testHistoryDb = [];

// ── Helpers ────────────────────────────────────────────────────────

function safeName(value, fallback = 'source') {
  return String(value || '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[._-]+|[._-]+$/g, '') || fallback;
}

function projectNameFromZip(zipFilename) {
  return safeName(path.basename(zipFilename, path.extname(zipFilename)), 'source_project');
}

function isPathInside(parentDir, candidatePath) {
  const parent = path.resolve(parentDir);
  const candidate = path.resolve(candidatePath);
  const rel = path.relative(parent, candidate);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function extractZipSafely(zipPath, extractRoot) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const dest = path.resolve(extractRoot, entry.entryName);
    if (!isPathInside(extractRoot, dest)) {
      throw new Error(`Unsafe zip path: ${entry.entryName}`);
    }
  }
  zip.extractAllTo(extractRoot, true);
  return entries.filter(e => !e.isDirectory).length;
}

// ── Background job runner ─────────────────────────────────────────

async function runPipelineJob(jobId, sourcePath, baseUrl) {
  updateJob(jobId, {
    status: 'running',
    stage: 'initializing',
    progress_percent: 12,
    message: 'Preparing the AI pipeline',
    sub_progress: null,
    started_at: new Date().toISOString(),
  });

  const job = getJob(jobId);

  try {
    const pipeline = new Pipeline({
      userId: job.user_id,
      projectId: job.project_id,
      sourceCodePath: sourcePath,
      onProgress: (progress) => updateJob(jobId, progress),
    });

    updateJob(jobId, { run_id: pipeline.runId, run_workspace_dir: pipeline.runWorkspaceDir });
    await pipeline.execute(baseUrl || TARGET_BASE_URL);

    const tokensUsed = pipeline.tokensUsed || 0;
    addUserTokens(job.user_id, tokensUsed);

    updateJob(jobId, {
      status: 'completed',
      stage: 'completed',
      progress_percent: 100,
      message: 'AI pipeline completed',
      sub_progress: null,
      finished_at: new Date().toISOString(),
      tokens_used: tokensUsed,
      result: pipeline.loadFinalReport(),
    });
  } catch (err) {
    const error = { type: err.constructor.name, message: err.message };
    if (AI_DEBUG) error.stack = err.stack;
    updateJob(jobId, {
      success: false,
      status: 'failed',
      stage: 'failed',
      progress_percent: 100,
      message: 'AI pipeline failed',
      sub_progress: null,
      finished_at: new Date().toISOString(),
      error,
    });
  }
}

// ── Controllers ────────────────────────────────────────────────────

async function uploadSource(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a .zip source file' });
  }

  const userId = req.user.id;
  const projectId = uuidv4();
  const workspaceRoot = path.resolve(WORKSPACE_BASE_PATH);
  const projectsDir = path.join(workspaceRoot, safeName(userId), 'projects');
  const projectName = projectNameFromZip(req.file.originalname);
  const extractDir = path.join(projectsDir, projectName);
  const tempExtractDir = path.join(projectsDir, `.${projectName}_${projectId}_extracting`);
  const archivePath = req.file.path;

  try {
    if (!isPathInside(projectsDir, archivePath)) {
      throw new Error('Invalid upload path');
    }

    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.mkdirSync(tempExtractDir, { recursive: true });
    extractZipSafely(archivePath, tempExtractDir);
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.renameSync(tempExtractDir, extractDir);
    fs.rmSync(archivePath, { force: true });

    return res.json({
      success: true,
      message: 'Source uploaded and extracted successfully',
      data: {
        user_id: userId,
        project_id: projectId,
        project_name: projectName,
        workspace_path: path.join(workspaceRoot, safeName(userId)),
        source_path: extractDir,
        source_archive_path: null,
      },
    });
  } catch (err) {
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.rmSync(archivePath, { force: true });
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function startTest(req, res) {
  const { user_id, project_id, source_path, base_url } = req.body;
  const authenticatedUserId = req.user.id;

  if (!user_id || !project_id || !source_path) {
    return res.status(400).json({
      success: false,
      message: 'Required: user_id, project_id, and source_path',
    });
  }
  if (String(user_id) !== String(authenticatedUserId)) {
    return res.status(403).json({ success: false, message: 'user_id does not match the authenticated user' });
  }

  const resolvedSourcePath = path.resolve(source_path);
  const projectsDir = path.join(path.resolve(WORKSPACE_BASE_PATH), safeName(authenticatedUserId), 'projects');
  if (!isPathInside(projectsDir, resolvedSourcePath)) {
    return res.status(400).json({ success: false, message: 'source_path must be inside the user projects workspace' });
  }
  if (!fs.existsSync(resolvedSourcePath) || !fs.statSync(resolvedSourcePath).isDirectory()) {
    return res.status(400).json({ success: false, message: 'source_path does not exist or is not a directory' });
  }

  const job = createJob({ userId: authenticatedUserId, projectId: project_id, sourcePath: resolvedSourcePath, baseUrl: base_url });
  setImmediate(() => runPipelineJob(job.job_id, resolvedSourcePath, base_url));

  return res.json({ success: true, data: job });
}

function getTestStatus(req, res) {
  const { project_id } = req.params;
  const job = getJobByProject(project_id);
  if (!job) {
    return res.status(404).json({ success: false, message: 'No test job found for this project_id' });
  }
  return res.json({ success: true, data: job });
}

function addTestHistory(req, res) {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ success: false, message: 'Filename is required' });

  const timestamp = new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '');

  const record = { id: uuidv4(), user_id: req.user.id, filename, timestamp };
  testHistoryDb.unshift(record);
  return res.json({ success: true, data: record });
}

function getTestHistory(req, res) {
  return res.json({ success: true, data: testHistoryDb.filter(r => r.user_id === req.user.id) });
}

async function startTestFromGithub(req, res) {
  const { repo_full_name, branch = 'main', base_url } = req.body;
  const userId = req.user.id;
  const githubToken = req.user.github_token;

  if (!repo_full_name) {
    return res.status(400).json({ success: false, message: 'repo_full_name is required (e.g. "owner/repo")' });
  }
  if (!githubToken) {
    return res.status(403).json({ success: false, message: 'GitHub not connected. Please connect your GitHub account first.' });
  }

  // Validate tên repo an toàn (không có command injection)
  if (!/^[\w.\-]+\/[\w.\-]+$/.test(repo_full_name)) {
    return res.status(400).json({ success: false, message: 'Invalid repo name format' });
  }

  const projectId = uuidv4();
  const cloneDir = path.join(
    path.resolve(SOURCE_WORKSPACE_BASE_PATH),
    safeName(userId), `github_${projectId}`
  );

  // Dùng OAuth token để clone — hoạt động với cả private repo
  const cloneUrl = `https://x-access-token:${githubToken}@github.com/${repo_full_name}.git`;

  try {
    fs.mkdirSync(path.dirname(cloneDir), { recursive: true });
    execSync(
      `git clone --depth=1 --branch ${branch} ${cloneUrl} ${cloneDir}`,
      { timeout: 120_000, stdio: 'pipe' }
    );
  } catch (err) {
    const msg = (err.stderr || err.stdout || err.message || '').toString().split('\n').find(l => l.trim()) || 'Clone failed';
    return res.status(400).json({ success: false, message: `Clone failed: ${msg}` });
  }

  const job = createJob({ userId, projectId, sourcePath: cloneDir, baseUrl: base_url });
  setImmediate(() => runPipelineJob(job.job_id, cloneDir, base_url));
  return res.json({ success: true, data: { ...job, repo: repo_full_name, branch } });
}

module.exports = { uploadSource, startTest, startTestFromGithub, getTestStatus, addTestHistory, getTestHistory };
