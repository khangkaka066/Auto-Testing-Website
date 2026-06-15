const fs = require('fs');
const path = require('path');
const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
} = require('../config/env');

let client;

function requireR2Config() {
  const missing = [];
  if (!R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
  if (!R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
  if (!R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
  if (!R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');

  if (missing.length > 0) {
    throw new Error(`Missing Cloudflare R2 env keys: ${missing.join(', ')}`);
  }
}

function getClient() {
  requireR2Config();
  if (!client) {
    const { S3Client } = require('@aws-sdk/client-s3');
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

function safeKeySegment(value, fallback = 'item') {
  return String(value || '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '') || fallback;
}

async function putObject({ key, body, contentType, contentLength, metadata }) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  await getClient().send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: contentLength,
    Metadata: metadata,
  }));
}

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

async function getJsonObject(key) {
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const response = await getClient().send(new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  }));
  return JSON.parse(await streamToString(response.Body));
}

function isJsonFile(filePath) {
  return path.extname(filePath).toLowerCase() === '.json';
}

function walkJsonFiles(rootDir) {
  if (!rootDir || !fs.existsSync(rootDir)) return [];

  const files = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && isJsonFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function toObjectKeyPath(relativePath) {
  return relativePath.split(path.sep).map(segment => safeKeySegment(segment, 'item')).join('/');
}

function stageFromRelativePath(relativePath) {
  const [first] = relativePath.split(/[\\/]/);
  return first || 'run';
}

async function uploadRunJsonArtifacts({
  runWorkspaceDir,
  userId,
  projectId,
  runId,
  jobId,
  status,
}) {
  const rootDir = path.resolve(runWorkspaceDir);
  const safeUserId = safeKeySegment(userId, 'user');
  const safeProjectId = safeKeySegment(projectId, 'project');
  const prefix = `users/${safeUserId}/${safeProjectId}`;
  const jsonFiles = walkJsonFiles(rootDir);

  const uploadedFiles = [];
  for (const filePath of jsonFiles) {
    const relativePath = path.relative(rootDir, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) continue;

    const stats = fs.statSync(filePath);
    const key = `${prefix}/${toObjectKeyPath(relativePath)}`;
    await putObject({
      key,
      body: fs.createReadStream(filePath),
      contentType: 'application/json',
      contentLength: stats.size,
      metadata: {
        user_id: String(userId),
        project_id: String(projectId),
        run_id: String(runId),
        job_id: String(jobId || ''),
        stage: stageFromRelativePath(relativePath),
      },
    });

    uploadedFiles.push({
      path: relativePath.replace(/\\/g, '/'),
      key,
      size: stats.size,
      stage: stageFromRelativePath(relativePath),
    });
  }

  const manifestKey = `${prefix}/manifest.json`;
  const manifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    user_id: userId,
    project_id: projectId,
    run_id: runId,
    job_id: jobId || null,
    status: status || null,
    storage: {
      provider: 'cloudflare-r2',
      bucket: R2_BUCKET_NAME,
      prefix,
      manifest_key: manifestKey,
    },
    json_file_count: uploadedFiles.length,
    total_json_bytes: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
    files: uploadedFiles,
  };
  const manifestBody = JSON.stringify(manifest, null, 2);

  await putObject({
    key: manifestKey,
    body: manifestBody,
    contentType: 'application/json',
    contentLength: Buffer.byteLength(manifestBody),
    metadata: {
      user_id: String(userId),
      project_id: String(projectId),
      run_id: String(runId),
      job_id: String(jobId || ''),
      status: String(status || ''),
    },
  });

  return {
    bucket: R2_BUCKET_NAME,
    prefix,
    manifestKey,
    jsonFileCount: manifest.json_file_count,
    totalJsonBytes: manifest.total_json_bytes,
    files: uploadedFiles,
  };
}

module.exports = {
  getJsonObject,
  uploadRunJsonArtifacts,
};
