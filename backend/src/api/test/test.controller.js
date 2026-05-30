const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');
const { createJob, updateJob, getJobByProject, getJob } = require('../../lib/jobStore');
const Pipeline = require('../../pipeline/Pipeline');
const {
  SOURCE_WORKSPACE_BASE_PATH,
  UPLOAD_ARCHIVE_BASE_PATH,
  TARGET_BASE_URL,
  AI_DEBUG,
} = require('../../config/env');

// In-memory test history
const testHistoryDb = [];

// ── Helpers ────────────────────────────────────────────────────────

function safeName(value, fallback = 'source') {
  return (value || '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[._-]+|[._-]+$/g, '') || fallback;
}

function buildUniqueExtractDir(rootDir, zipFilename) {
  const base = path.basename(zipFilename, path.extname(zipFilename))
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '') || 'source_project';

  let dir = path.join(rootDir, base);
  if (fs.existsSync(dir)) {
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    dir = path.join(rootDir, `${base}_${ts}`);
  }
  return dir;
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
    progress_percent: 40,
    message: 'AI pipeline is running',
    started_at: new Date().toISOString(),
  });

  const job = getJob(jobId);

  try {
    const pipeline = new Pipeline({
      userId: job.user_id,
      projectId: job.project_id,
      sourceCodePath: sourcePath,
    });

    updateJob(jobId, { run_id: pipeline.runId, run_workspace_dir: pipeline.runWorkspaceDir });
    await pipeline.execute(baseUrl || TARGET_BASE_URL);

    updateJob(jobId, {
      status: 'completed',
      progress_percent: 100,
      message: 'AI pipeline completed',
      finished_at: new Date().toISOString(),
      result: pipeline.loadFinalReport(),
    });
  } catch (err) {
    const error = { type: err.constructor.name, message: err.message };
    if (AI_DEBUG) error.stack = err.stack;
    updateJob(jobId, {
      success: false,
      status: 'failed',
      progress_percent: 100,
      message: 'AI pipeline failed',
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
  const sourceRoot = path.resolve(SOURCE_WORKSPACE_BASE_PATH);
  const archiveRoot = path.resolve(UPLOAD_ARCHIVE_BASE_PATH);
  const extractDir = buildUniqueExtractDir(path.join(sourceRoot, userId, 'source'), req.file.originalname);
  const archiveDir = path.join(archiveRoot, userId);
  const archivePath = path.join(archiveDir, `${projectId}-${path.basename(req.file.filename)}`);

  try {
    fs.mkdirSync(extractDir, { recursive: true });
    fs.mkdirSync(archiveDir, { recursive: true });
    fs.copyFileSync(req.file.path, archivePath);
    fs.rmSync(req.file.path, { force: true });

    return res.json({
      success: true,
      message: 'Source uploaded successfully',
      data: {
        user_id: userId,
        project_id: projectId,
        workspace_path: path.join(sourceRoot, userId),
        source_path: extractDir,
        source_archive_path: archivePath,
      },
    });
  } catch (err) {
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.rmSync(archivePath, { force: true });
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function startTest(req, res) {
  const { user_id, project_id, source_path, source_archive_path, base_url } = req.body;

  if (!user_id || !project_id || (!source_path && !source_archive_path)) {
    return res.status(400).json({
      success: false,
      message: 'Required: user_id, project_id, and source_path or source_archive_path',
    });
  }

  let resolvedSourcePath;

  if (source_archive_path) {
    const archivePath = path.resolve(source_archive_path);
    const archiveRoot = path.resolve(UPLOAD_ARCHIVE_BASE_PATH);
    if (!isPathInside(archiveRoot, archivePath) || !fs.existsSync(archivePath)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing source_archive_path' });
    }

    const extractDir = path.join(
      path.resolve(SOURCE_WORKSPACE_BASE_PATH),
      safeName(user_id), safeName(project_id),
      `source_${uuidv4().replace(/-/g, '').slice(0, 12)}`
    );
    try {
      fs.mkdirSync(extractDir, { recursive: true });
      extractZipSafely(archivePath, extractDir);
      resolvedSourcePath = extractDir;
    } catch (err) {
      fs.rmSync(extractDir, { recursive: true, force: true });
      return res.status(400).json({ success: false, message: `Zip extraction failed: ${err.message}` });
    }
  } else {
    resolvedSourcePath = path.resolve(source_path);
    if (!fs.existsSync(resolvedSourcePath) || !fs.statSync(resolvedSourcePath).isDirectory()) {
      return res.status(400).json({ success: false, message: 'source_path does not exist or is not a directory' });
    }
  }

  const job = createJob({ userId: user_id, projectId: project_id, sourcePath: resolvedSourcePath, baseUrl: base_url });
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

module.exports = { uploadSource, startTest, getTestStatus, addTestHistory, getTestHistory };
