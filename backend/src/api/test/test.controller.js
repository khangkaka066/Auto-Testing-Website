const fs = require('fs');
const path = require('path');
const axios = require('axios');
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

function parseScoreValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : null;
  const match = String(value).match(/\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, Math.round(parsed))) : null;
}

async function downloadGithubArchive({ repoFullName, branch, githubToken, destinationDir }) {
  const archiveUrl = `https://api.github.com/repos/${repoFullName}/zipball/${encodeURIComponent(branch)}`;
  const response = await axios.get(archiveUrl, {
    responseType: 'arraybuffer',
    maxContentLength: 250 * 1024 * 1024,
    maxBodyLength: 250 * 1024 * 1024,
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'TestPilot',
    },
  });

  const zip = new AdmZip(Buffer.from(response.data));
  const entries = zip.getEntries();
  const rootDir = entries.find(entry => entry.entryName.includes('/'))?.entryName.split('/')[0];
  const destinationRoot = path.resolve(destinationDir);

  fs.mkdirSync(destinationRoot, { recursive: true });

  for (const entry of entries) {
    const relativeName = rootDir && entry.entryName.startsWith(`${rootDir}/`)
      ? entry.entryName.slice(rootDir.length + 1)
      : entry.entryName;

    if (!relativeName) continue;

    const outputPath = path.resolve(destinationRoot, relativeName);
    if (!outputPath.startsWith(`${destinationRoot}${path.sep}`)) {
      throw new Error('Archive contains an unsafe file path');
    }

    if (entry.isDirectory) {
      fs.mkdirSync(outputPath, { recursive: true });
      continue;
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, entry.getData());
  }
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
    score: parseScoreValue(score),
    status,
    display_ts: displayTs,
  };

  const { error } = await supabase.from('test_reports').insert([record]);
  if (error) {
    if (jobId && error.code === '23505') {
      const { error: updateError } = await supabase
        .from('test_reports')
        .update(record)
        .eq('job_id', jobId);
      if (updateError) console.error('[createTestHistory] Supabase update error:', updateError.message);
    } else {
      console.error('[createTestHistory] Supabase insert error:', error.message);
    }
  }
  return record;
}

async function ensureProjectRecord({ userId, projectId, projectName, description }) {
  if (!userId || !projectId) {
    throw new Error('Cannot create project record without user_id and project_id');
  }

  const record = {
    project_id: projectId,
    user_id: userId,
    project_name: projectName || safeName(projectId, 'project'),
    description: description || null,
  };

  const { error } = await supabase
    .from('projects')
    .upsert(record, { onConflict: 'project_id', ignoreDuplicates: false });

  if (error) {
    console.error('[ensureProjectRecord] Supabase error:', error.message);
    throw new Error(`Could not create project record: ${error.message}`);
  }

  return record;
}

async function updateTestHistoryByJob(jobId, changes) {
  if (!jobId) return null;
  const nextChanges = { ...changes };
  if (Object.prototype.hasOwnProperty.call(nextChanges, 'score')) {
    nextChanges.score = parseScoreValue(nextChanges.score);
  }
  const { error } = await supabase.from('test_reports').update(nextChanges).eq('job_id', jobId);
  if (error) console.error('[updateTestHistoryByJob] Supabase error:', error.message);
  return null;
}

function buildJobState(job) {
  if (!job) return null;
  return {
    success: job.success,
    job_id: job.job_id,
    run_id: job.run_id,
    status: job.status,
    progress_percent: job.progress_percent,
    stage: job.stage,
    message: job.message,
    sub_progress: job.sub_progress,
    user_id: job.user_id,
    project_id: job.project_id,
    source_path: job.source_path,
    base_url: job.base_url,
    created_at: job.created_at,
    started_at: job.started_at,
    finished_at: job.finished_at,
    error: job.error,
  };
}

function serializePipelineError(err) {
  const error = {
    type: err?.constructor?.name || 'Error',
    message: err?.message || 'Unknown pipeline error',
  };
  if (AI_DEBUG && err?.stack) error.stack = err.stack;
  return error;
}

function failureMessage(stage, error) {
  const stageLabel = stage && stage !== 'queued' ? ` at ${stage}` : '';
  return `AI pipeline failed${stageLabel}: ${error.message}`;
}

function finalReportToResultSummary(finalReport, score = null) {
  if (!finalReport) return null;
  return {
    health_score: finalReport.health_score ?? score ?? null,
    passed: finalReport.summary?.passed ?? 0,
    failed: finalReport.summary?.failed ?? 0,
    total: finalReport.summary?.total ?? 0,
    duration: finalReport.summary?.duration ?? null,
    issues_count: (finalReport.issues ?? []).length,
    issues: (finalReport.issues ?? []).slice(0, 20),
  };
}

async function persistJobSnapshot(job) {
  const jobState = buildJobState(job);
  if (!jobState || !jobState.job_id) return null;
  const finalReport = job?.result?.final_report;
  const resultSummary = finalReportToResultSummary(finalReport, job?.score);
  const changes = {
    status: jobState.status,
    start_time: jobState.started_at || jobState.created_at,
    end_time: jobState.finished_at || null,
    result_summary: resultSummary || { job_state: jobState },
    ...(resultSummary ? { score: parseScoreValue(resultSummary.health_score) } : {}),
  };
  const { data, error } = await supabase
    .from('test_reports')
    .update(changes)
    .eq('job_id', jobState.job_id)
    .select('job_id');
  if (error) console.error('[persistJobSnapshot] Supabase error:', error.message);
  if (!error && (!data || data.length === 0)) {
    const fallback = {
      user_id: jobState.user_id,
      project_id: jobState.project_id,
      job_id: jobState.job_id,
      filename: displayNameFromSource(jobState.source_path),
      ...changes,
    };
    const { error: insertError } = await supabase.from('test_reports').insert([fallback]);
    if (insertError) console.error('[persistJobSnapshot] Supabase fallback insert error:', insertError.message);
  }
  return null;
}

function updateJobAndSnapshot(jobId, changes) {
  updateJob(jobId, changes);
  const job = getJob(jobId);
  if (job) {
    persistJobSnapshot(job).catch(err => {
      console.error('[updateJobAndSnapshot] Supabase error:', err.message);
    });
  }
  return job;
}

function reportSummaryToFinalReport(summary, score) {
  if (!summary) return null;
  if (summary.job_state) return summary.job_state.result?.final_report || null;
  return {
    health_score: summary.health_score ?? score ?? null,
    summary: {
      passed: summary.passed ?? 0,
      failed: summary.failed ?? 0,
      total: summary.total ?? 0,
      duration: summary.duration ?? null,
    },
    issues: summary.issues || [],
  };
}

function loadFinalReportFromJobState(jobState) {
  if (!jobState?.run_id || !jobState?.user_id) return null;
  const reportPath = path.join(
    path.resolve(WORKSPACE_BASE_PATH),
    safeName(jobState.user_id),
    'runs',
    safeName(jobState.run_id),
    '7_reporter',
    'final_report.json'
  );
  try {
    if (!fs.existsSync(reportPath)) return null;
    return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  } catch (err) {
    console.error('[loadFinalReportFromJobState] Failed to read final report:', err.message);
    return null;
  }
}

function hydrateJobWithPersistedReport(job, persisted) {
  if (!job || !persisted?.result_summary || persisted.result_summary.job_state) return job;
  const finalReport = reportSummaryToFinalReport(persisted.result_summary, persisted.score);
  if (!finalReport) return job;
  return {
    ...job,
    status: persisted.status || job.status,
    progress_percent: persisted.status === 'completed' ? 100 : job.progress_percent,
    stage: persisted.status === 'completed' ? 'completed' : job.stage,
    finished_at: persisted.end_time || job.finished_at,
    result: job.result || { final_report: finalReport },
  };
}

async function getPersistedTestReport(projectId, userId) {
  const { data, error } = await supabase
    .from('test_reports')
    .select('project_id, job_id, user_id, start_time, end_time, score, status, result_summary')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[getPersistedTestReport] Supabase error:', error.message);
    return null;
  }
  return data || null;
}

async function getPersistedJobByProject(projectId, userId) {
  const data = await getPersistedTestReport(projectId, userId);
  if (!data) return null;

  const jobState = data.result_summary?.job_state;
  if (jobState) {
    const finalReport = reportSummaryToFinalReport(data.result_summary, data.score)
      || loadFinalReportFromJobState(jobState);
    if (finalReport && !jobState.result?.final_report) {
      updateTestHistoryByJob(data.job_id, {
        result_summary: finalReportToResultSummary(finalReport),
        score: finalReport.health_score,
      }).catch(err => {
        console.error('[getPersistedJobByProject] Failed to repair persisted report:', err.message);
      });
    }
    return {
      ...jobState,
      progress_percent: jobState.status === 'completed' ? 100 : jobState.progress_percent,
      result: jobState.result || (finalReport ? { final_report: finalReport } : null),
    };
  }

  const finalReport = reportSummaryToFinalReport(data.result_summary, data.score);
  return {
    success: true,
    job_id: data.job_id,
    run_id: null,
    status: data.status || (finalReport ? 'completed' : 'queued'),
    progress_percent: data.status === 'completed' ? 100 : 10,
    stage: data.status === 'completed' ? 'completed' : data.status || 'queued',
    message: finalReport ? 'AI pipeline completed' : 'Test job snapshot loaded from history',
    sub_progress: null,
    user_id: data.user_id,
    project_id: data.project_id,
    source_path: null,
    base_url: null,
    created_at: data.start_time,
    started_at: data.start_time,
    finished_at: data.end_time,
    result: finalReport ? { final_report: finalReport } : null,
    error: null,
  };
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

async function runPipelineJob(jobId, sourcePath, baseUrl, testType = 'UI Testing') {
  const startedAt = new Date().toISOString();
  updateJobAndSnapshot(jobId, {
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
      testType: job.test_type || testType,
      onProgress: (progress) => updateJobAndSnapshot(jobId, progress),
    });

    updateJobAndSnapshot(jobId, { run_id: pipeline.runId, run_workspace_dir: pipeline.runWorkspaceDir });
    await pipeline.execute(baseUrl || TARGET_BASE_URL);

    const tokensUsed   = pipeline.tokensUsed   || 0;
    const finishedAt = new Date().toISOString();
    const result = pipeline.loadFinalReport();
    const score = result.final_report && result.final_report.health_score != null
      ? parseScoreValue(result.final_report.health_score)
      : null;

    updateJobAndSnapshot(jobId, {
      status: 'completed',
      stage: 'completed',
      progress_percent: 100,
      message: 'AI pipeline completed',
      sub_progress: null,
      finished_at: finishedAt,
      tokens_used: tokensUsed,
      result,
    });

    const resultSummary = finalReportToResultSummary(result?.final_report);

    await updateTestHistoryByJob(jobId, {
      end_time: finishedAt,
      status: 'completed',
      score,
      result_summary: resultSummary,
    });
    addUserTokens(job.user_id, tokensUsed).catch(err => {
      console.error('[runPipelineJob] token accounting error:', err.message);
    });
  } catch (err) {
    const currentJob = getJob(jobId);
    const failedStage = currentJob?.stage || 'failed';
    const error = serializePipelineError(err);
    const finishedAt = new Date().toISOString();
    const failedJob = updateJobAndSnapshot(jobId, {
      success: false,
      status: 'failed',
      stage: 'failed',
      progress_percent: 100,
      message: failureMessage(failedStage, error),
      sub_progress: null,
      finished_at: finishedAt,
      error,
    });
    await updateTestHistoryByJob(jobId, {
      end_time: finishedAt,
      status: 'failed',
      score: null,
      result_summary: { job_state: buildJobState(failedJob) },
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

    const fileSizeBytes = req.file.size || 0;
    const sourceStorage = await uploadSourceArchiveWithManifest({
      archivePath,
      originalFilename: req.file.originalname,
      userId,
      projectId,
      projectName,
    });
    fs.rmSync(archivePath, { force: true });

    await ensureProjectRecord({
      userId,
      projectId,
      projectName: path.basename(req.file.originalname, '.zip'),
      description: `Uploaded from ${req.file.originalname}`,
    });

    // Ghi log upload file zip vào Supabase
    const { error: uploadedFileError } = await supabase.from('uploaded_files').insert([{
      project_id: projectId,
      file_name: req.file.originalname,
      file_path: sourceStorage.archiveKey,
      file_size: fileSizeBytes,
    }]);
    if (uploadedFileError) {
      throw new Error(`Could not save uploaded file record: ${uploadedFileError.message}`);
    }

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
  const { user_id, project_id, source_path, base_url, source_name, test_type } = req.body;
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

  await ensureProjectRecord({
    userId: authenticatedUserId,
    projectId: project_id,
    projectName: source_name || displayNameFromSource(resolvedSourcePath),
    description: `Test run for ${source_name || displayNameFromSource(resolvedSourcePath)}`,
  });

  const job = createJob({ userId: authenticatedUserId, projectId: project_id, sourcePath: resolvedSourcePath, baseUrl: base_url, testType: test_type });
  await createTestHistory({
    userId: authenticatedUserId,
    projectId: project_id,
    jobId: job.job_id,
    filename: source_name || displayNameFromSource(resolvedSourcePath),
    startTime: job.started_at || job.created_at,
    status: job.status,
  });
  await persistJobSnapshot(job);
  setImmediate(() => runPipelineJob(job.job_id, resolvedSourcePath, base_url, test_type));

  return res.json({ success: true, data: job });
}

async function getTestStatus(req, res) {
  const { project_id } = req.params;
  const job = getJobByProject(project_id);
  if (job) {
    const persisted = await getPersistedTestReport(project_id, req.user.id);
    return res.json({ success: true, data: hydrateJobWithPersistedReport(job, persisted) });
  }

  const persistedJob = await getPersistedJobByProject(project_id, req.user.id);
  if (persistedJob) return res.json({ success: true, data: persistedJob });

  return res.status(404).json({ success: false, message: 'No test job found for this project_id' });
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
  const { repo_full_name, branch = 'main', base_url, test_type } = req.body;
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

  try {
    fs.mkdirSync(path.dirname(cloneDir), { recursive: true });
    await downloadGithubArchive({
      repoFullName: repo_full_name,
      branch,
      githubToken,
      destinationDir: cloneDir,
    });
  } catch (err) {
    const status = err.response?.status;
    const githubMessage = Buffer.isBuffer(err.response?.data)
      ? err.response.data.toString('utf8')
      : typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || '';
    const reason = status === 404
      ? `repository or branch not found: ${repo_full_name}@${branch}`
      : (githubMessage || err.message || 'download failed');
    return res.status(400).json({ success: false, message: `Clone failed: ${reason}` });
  }

  await ensureProjectRecord({
    userId,
    projectId,
    projectName: repo_full_name,
    description: `GitHub repository ${repo_full_name}@${branch}`,
  });

  const job = createJob({ userId, projectId, sourcePath: cloneDir, baseUrl: base_url, testType: test_type });
  await createTestHistory({
    userId,
    projectId,
    jobId: job.job_id,
    filename: repo_full_name,
    startTime: job.started_at || job.created_at,
    status: job.status,
  });
  await persistJobSnapshot(job);
  setImmediate(() => runPipelineJob(job.job_id, cloneDir, base_url, test_type));
  return res.json({ success: true, data: { ...job, repo: repo_full_name, branch } });
}

module.exports = { uploadSource, startTest, startTestFromGithub, getTestStatus, addTestHistory, getTestHistory, getTestDashboardStats };
