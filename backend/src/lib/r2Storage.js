const fs = require('fs');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
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

function normalizeZipEntryName(entryName) {
  return String(entryName || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function crc32Hex(value) {
  if (!Number.isFinite(value)) return null;
  return (value >>> 0).toString(16).padStart(8, '0');
}

function getCommonRoot(files) {
  if (files.length === 0) return null;
  const firstParts = files[0].path.split('/');
  if (firstParts.length <= 1) return null;
  const candidate = firstParts[0];
  return files.every(file => file.path.split('/')[0] === candidate) ? candidate : null;
}

async function createSourceManifest({
  archivePath,
  originalFilename,
  userId,
  projectId,
  projectName,
}) {
  const zip = new AdmZip(archivePath);
  const entries = zip.getEntries();
  const files = entries
    .filter(entry => !entry.isDirectory)
    .map(entry => ({
      path: normalizeZipEntryName(entry.entryName),
      size: entry.header.size,
      compressed_size: entry.header.compressedSize,
      crc32: crc32Hex(entry.header.crc),
    }))
    .filter(file => file.path)
    .sort((a, b) => a.path.localeCompare(b.path));

  const archiveStats = fs.statSync(archivePath);
  const topLevel = [...new Set(files.map(file => file.path.split('/')[0]).filter(Boolean))].sort();

  return {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    user_id: userId,
    project_id: projectId,
    project_name: projectName,
    original_filename: originalFilename,
    archive: {
      size: archiveStats.size,
      sha256: await sha256File(archivePath),
    },
    zip: {
      file_count: files.length,
      total_uncompressed_size: files.reduce((sum, file) => sum + (file.size || 0), 0),
      common_root: getCommonRoot(files),
      top_level_entries: topLevel,
    },
    files,
  };
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

async function uploadSourceArchiveWithManifest({
  archivePath,
  originalFilename,
  userId,
  projectId,
  projectName,
}) {
  const safeUserId = safeKeySegment(userId, 'user');
  const safeProjectId = safeKeySegment(projectId, 'project');
  const prefix = `users/${safeUserId}/projects/${safeProjectId}/source`;
  const archiveKey = `${prefix}/source.zip`;
  const manifestKey = `${prefix}/manifest.json`;

  const manifest = await createSourceManifest({
    archivePath,
    originalFilename,
    userId,
    projectId,
    projectName,
  });
  const archiveStats = fs.statSync(archivePath);
  const manifestBody = JSON.stringify({
    ...manifest,
    storage: {
      provider: 'cloudflare-r2',
      bucket: R2_BUCKET_NAME,
      archive_key: archiveKey,
      manifest_key: manifestKey,
    },
  }, null, 2);

  await putObject({
    key: archiveKey,
    body: fs.createReadStream(archivePath),
    contentType: 'application/zip',
    contentLength: archiveStats.size,
    metadata: {
      user_id: String(userId),
      project_id: String(projectId),
    },
  });

  await putObject({
    key: manifestKey,
    body: manifestBody,
    contentType: 'application/json',
    contentLength: Buffer.byteLength(manifestBody),
    metadata: {
      user_id: String(userId),
      project_id: String(projectId),
    },
  });

  return {
    bucket: R2_BUCKET_NAME,
    prefix,
    archiveKey,
    manifestKey,
    manifest,
  };
}

module.exports = {
  uploadSourceArchiveWithManifest,
};
