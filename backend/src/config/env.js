require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

function intFromEnv(name, fallback, min = 0) {
  const parsed = parseInt(process.env[name] || String(fallback), 10);
  return Number.isFinite(parsed) ? Math.max(min, parsed) : fallback;
}

module.exports = {
  PORT: intFromEnv('PORT', 5001, 1),
  DB_NAME: process.env.DB_NAME || 'testpilot_db',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AI_DEBUG: (process.env.AI_DEBUG || 'false').toLowerCase() === 'true',
  AI_MAX_WORKERS: intFromEnv('AI_MAX_WORKERS', 4, 1),
  AI_CACHE_ENABLED: (process.env.AI_CACHE_ENABLED || 'true').toLowerCase() !== 'false',
  AI_RETRY_COUNT: intFromEnv('AI_RETRY_COUNT', 3, 0),
  WORKSPACE_BASE_PATH: process.env.WORKSPACE_BASE_PATH || 'workspaces',
  SOURCE_WORKSPACE_BASE_PATH: process.env.SOURCE_WORKSPACE_BASE_PATH || 'uploaded_sources',
  UPLOAD_ARCHIVE_BASE_PATH: process.env.UPLOAD_ARCHIVE_BASE_PATH || 'uploaded_archives',
  TARGET_BASE_URL: process.env.TARGET_BASE_URL || 'http://localhost:5173',
  SERVICE_START_TIMEOUT_MS: intFromEnv('SERVICE_START_TIMEOUT_MS', 120000, 1000),
  AI_PYTHON_URL: process.env.AI_PYTHON_URL || 'http://localhost:8001',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/auth/github/callback',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || '',
};
