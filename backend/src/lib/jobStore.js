const { v4: uuidv4 } = require('uuid');

const _jobs = {};
const _latestByProject = {};

function _now() {
  return new Date().toISOString();
}

function createJob({ userId, projectId, sourcePath, baseUrl }) {
  const jobId = uuidv4();
  const job = {
    success: true,
    job_id: jobId,
    run_id: null,
    status: 'queued',
    progress_percent: 10,
    message: 'AI pipeline da duoc dua vao hang doi',
    user_id: userId,
    project_id: projectId,
    source_path: sourcePath,
    base_url: baseUrl || null,
    created_at: _now(),
    started_at: null,
    finished_at: null,
    result: null,
    error: null,
  };
  _jobs[jobId] = job;
  _latestByProject[projectId] = jobId;
  return { ...job };
}

function updateJob(jobId, changes) {
  if (_jobs[jobId]) Object.assign(_jobs[jobId], changes);
}

function getJobByProject(projectId) {
  const jobId = _latestByProject[projectId];
  if (!jobId) return null;
  const job = _jobs[jobId];
  return job ? { ...job } : null;
}

function getJob(jobId) {
  const job = _jobs[jobId];
  return job ? { ...job } : null;
}

module.exports = { createJob, updateJob, getJobByProject, getJob };
