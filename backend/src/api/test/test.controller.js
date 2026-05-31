const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');
const { createJob, updateJob, getJobByProject, getJob } = require('../../lib/jobStore');
const Pipeline = require('../../pipeline/Pipeline');
const { addUserTokens } = require('../../lib/tokenTracker');
const supabase = require('../../lib/supabase');
const { uploadSourceArchiveWithManifest } = require('../../lib/r2Storage');
const {
  WORKSPACE_BASE_PATH,
  SOURCE_WORKSPACE_BASE_PATH,
  TARGET_BASE_URL,
  AI_DEBUG,
} = require('../../config/env');

// ── Helpers ────────────────────────────────────────────────────────

function safeName(value, fallback = 'source') {
  return String(value || '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[._-]+|[._-]+$/g, '') || fallback;
}

function projectNameFromZip(zipFilename) {
  return safeName(path.basename(zipFilename, path.extname(zipFilename)), 'source_project');
}

function displayNameFromSource(sourcePath, fallback = 'source_project') {
  return safeName(path.basename(sourcePath || ''), fallback);
}

async function createTestHistory({
  userId,
  projectId,
  jobId,
  filename,
  startTime,
  endTime = null,
  score = null,
  status = 'queued',
  timestamp = null,
}) {
  const displayTs = timestamp || new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).replace(',', '');

  const record = {
    user_id: userId,
    project_id: projectId || null,
    job_id: jobId || null,
    filename,
    start_time: startTime || new Date().toISOString(),
    end_time: endTime,
    score,
    status,
    display_ts: displayTs,
  };

  const { error } = await supabase.from('test_reports').upsert(record, { onConflict: 'job_id', ignoreDuplicates: false });
  if (error) console.error('[createTestHistory] Supabase error:', error.message);
  return record;
}

async function updateTestHistoryByJob(jobId, changes) {
  if (!jobId) return null;
  const { error } = await supabase.from('test_reports').update(changes).eq('job_id', jobId);
  if (error) console.error('[updateTestHistoryByJob] Supabase error:', error.message);
  return null;
}

async function getDashboardStats(userId) {
  const { data, error } = await supabase
    .from('test_reports')
    .select('score, status, start_time, end_time, result_summary')
    .eq('user_id', userId);

  if (error || !data) return null;

  const total = data.length;
  const completed = data.filter(r => r.status === 'completed').length;
  const failed = data.filter(r => r.status === 'failed').length;

  const scores = data.map(r => {
    const raw = r.result_summary?.health_score ?? r.score;
    if (raw === null || raw === undefined) return null;
    const n = Number(String(raw).match(/\d+/)?.[0]);
    return isNaN(n) ? null : Math.min(100, Math.max(0, n));
  }).filter(s => s !== null);

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const bestScore = scores.length ? Math.max(...scores) : null;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const testsThisMonth = data.filter(r => r.start_time && r.start_time >= startOfMonth).length;
  const testsThisWeek = data.filter(r => r.start_time && r.start_time >= startOfWeek).length;

  const durations = data
    .filter(r => r.start_time && r.end_time)
    .map(r => (new Date(r.end_time) - new Date(r.start_time)) / 1000)
    .filter(d => d > 0 && d < 3600);
  const avgDurationSec = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  const totalPassed = data.reduce((sum, r) => sum + (r.result_summary?.passed ?? 0), 0);
  const totalFailed = data.reduce((sum, r) => sum + (r.result_summary?.failed ?? 0), 0);

  return {
    total_tests: total,
    completed_tests: completed,
    failed_tests: failed,
    success_rate: successRate,
    avg_score: avgScore,
    best_score: bestScore,
    tests_this_month: testsThisMonth,
    tests_this_week: testsThisWeek,
    avg_duration_sec: avgDurationSec,
    total_passed: totalPassed,
    total_failed: totalFailed,
  };
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
  const startedAt = new Date().toISOString();
  updateJob(jobId, {
    status: 'running',
    stage: 'initializing',
    progress_percent: 12,
    message: 'Preparing the AI pipeline',
    sub_progress: null,
    started_at: startedAt,
  });
  await updateTestHistoryByJob(jobId, { start_time: startedAt, status: 'running' });

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

    const finishedAt = new Date().toISOString();
    const result = pipeline.loadFinalReport();
    const score = result.final_report && result.final_report.health_score != null
      ? result.final_report.health_score
      : null;

    updateJob(jobId, {
      status: 'completed',
      stage: 'completed',
      progress_percent: 100,
      message: 'AI pipeline completed',
      sub_progress: null,
      finished_at: finishedAt,
      tokens_used: tokensUsed,
      result,
    });

    const finalReport = result?.final_report;
    const resultSummary = finalReport ? {
      health_score: finalReport.health_score ?? null,
      passed: finalReport.summary?.passed ?? 0,
      failed: finalReport.summary?.failed ?? 0,
      total: finalReport.summary?.total ?? 0,
      duration: finalReport.summary?.duration ?? null,
      issues_count: (finalReport.issues ?? []).length,
      issues: (finalReport.issues ?? []).slice(0, 20),
    } : null;

    await updateTestHistoryByJob(jobId, {
      end_time: finishedAt,
      status: 'completed',
      score,
      result_summary: resultSummary,
    });
  } catch (err) {
    const error = { type: err.constructor.name, message: err.message };
    if (AI_DEBUG) error.stack = err.stack;
    const finishedAt = new Date().toISOString();
    updateJob(jobId, {
      success: false,
      status: 'failed',
      stage: 'failed',
      progress_percent: 100,
      message: 'AI pipeline failed',
      sub_progress: null,
      finished_at: finishedAt,
      error,
    });
    await updateTestHistoryByJob(jobId, { end_time: finishedAt, status: 'failed', score: null });
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

    const fileSizeBytes = req.file.size || 0;
    const sourceStorage = await uploadSourceArchiveWithManifest({
      archivePath,
      originalFilename: req.file.originalname,
      userId,
      projectId,
      projectName,
    });
    fs.rmSync(archivePath, { force: true });

    // Ghi project vào Supabase
    await supabase.from('projects').insert([{
      project_id: projectId,
      user_id: userId,
      project_name: path.basename(req.file.originalname, '.zip'),
      description: `Uploaded from ${req.file.originalname}`,
    }]).then(() => {});

    // Ghi log upload file zip vào Supabase
    await supabase.from('uploaded_files').insert([{
      project_id: projectId,
      file_name: req.file.originalname,
      file_path: sourceStorage.archiveKey,
      file_size: fileSizeBytes,
    }]).then(() => {});

    return res.json({
      success: true,
      message: 'Source uploaded and extracted successfully',
      data: {
        user_id: userId,
        project_id: projectId,
        project_name: projectName,
        workspace_path: path.join(workspaceRoot, safeName(userId)),
        source_path: extractDir,
        source_archive_path: sourceStorage.archiveKey,
        source_manifest_path: sourceStorage.manifestKey,
        source_storage: {
          provider: 'cloudflare-r2',
          bucket: sourceStorage.bucket,
          prefix: sourceStorage.prefix,
          archive_key: sourceStorage.archiveKey,
          manifest_key: sourceStorage.manifestKey,
        },
      },
    });
  } catch (err) {
    fs.rmSync(tempExtractDir, { recursive: true, force: true });
    fs.rmSync(archivePath, { force: true });
    return res.status(400).json({ success: false, message: err.message });
  }
}

async function startTest(req, res) {
  const { user_id, project_id, source_path, base_url, source_name } = req.body;
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
  await createTestHistory({
    userId: authenticatedUserId,
    projectId: project_id,
    jobId: job.job_id,
    filename: source_name || displayNameFromSource(resolvedSourcePath),
    startTime: job.started_at || job.created_at,
    status: job.status,
  });
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

async function addTestHistory(req, res) {
  const { filename, project_id, job_id, start_time, end_time, score, status, timestamp } = req.body;
  if (!filename) return res.status(400).json({ success: false, message: 'Filename is required' });

  const record = await createTestHistory({
    userId: req.user.id,
    projectId: project_id,
    jobId: job_id,
    filename,
    startTime: start_time,
    endTime: end_time,
    score,
    status,
    timestamp,
  });
  return res.json({ success: true, data: record });
}

async function getTestHistory(req, res) {
  const { data, error } = await supabase
    .from('test_reports')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data: data || [] });
}

async function getTestDashboardStats(req, res) {
  const stats = await getDashboardStats(req.user.id);
  if (!stats) return res.status(500).json({ success: false, message: 'Failed to compute stats' });
  return res.json({ success: true, data: stats });
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
  await createTestHistory({
    userId,
    projectId,
    jobId: job.job_id,
    filename: repo_full_name,
    startTime: job.started_at || job.created_at,
    status: job.status,
  });
  setImmediate(() => runPipelineJob(job.job_id, cloneDir, base_url));
  return res.json({ success: true, data: { ...job, repo: repo_full_name, branch } });
}

module.exports = { uploadSource, startTest, startTestFromGithub, getTestStatus, addTestHistory, getTestHistory, getTestDashboardStats };
