require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });

module.exports = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  MONGO_URL: process.env.MONGO_URL || '',
  DB_NAME: process.env.DB_NAME || 'testpilot_db',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  AI_DEBUG: (process.env.AI_DEBUG || 'false').toLowerCase() === 'true',
  AI_MAX_WORKERS: Math.max(1, parseInt(process.env.AI_MAX_WORKERS || '4', 10)),
  AI_CACHE_ENABLED: (process.env.AI_CACHE_ENABLED || 'true').toLowerCase() !== 'false',
  AI_RETRY_COUNT: Math.max(1, parseInt(process.env.AI_RETRY_COUNT || '3', 10)),
  WORKSPACE_BASE_PATH: process.env.WORKSPACE_BASE_PATH || 'workspaces',
  SOURCE_WORKSPACE_BASE_PATH: process.env.SOURCE_WORKSPACE_BASE_PATH || 'uploaded_sources',
  UPLOAD_ARCHIVE_BASE_PATH: process.env.UPLOAD_ARCHIVE_BASE_PATH || 'uploaded_archives',
  TARGET_BASE_URL: process.env.TARGET_BASE_URL || 'http://localhost:5173',
  // GitHub OAuth
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/auth/github/callback',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};
