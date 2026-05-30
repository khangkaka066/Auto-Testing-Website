const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { AI_CACHE_ENABLED } = require('../config/env');

function stableHash(data) {
  const raw = typeof data === 'string'
    ? data
    : JSON.stringify(data, null, 0);
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function readCache(cacheDir, key) {
  if (!AI_CACHE_ENABLED) return null;
  const cachePath = path.join(cacheDir, `${key}.json`);
  if (!fs.existsSync(cachePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeCache(cacheDir, key, data) {
  if (!AI_CACHE_ENABLED) return;
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(
    path.join(cacheDir, `${key}.json`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}

module.exports = { stableHash, readCache, writeCache };
