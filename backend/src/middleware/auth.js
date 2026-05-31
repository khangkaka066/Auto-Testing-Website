const { findById } = require('../lib/userStore');

// Cache user objects để tránh gọi Supabase mỗi request
// TTL 60s: user đổi profile sẽ thấy sau tối đa 1 phút
const _userCache = new Map(); // token → { user, expiresAt }
const CACHE_TTL_MS = 60_000;

function getCachedUser(token) {
  const entry = _userCache.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _userCache.delete(token); return null; }
  return entry.user;
}

function setCachedUser(token, user) {
  // Giới hạn cache size để tránh memory leak
  if (_userCache.size > 5000) {
    const firstKey = _userCache.keys().next().value;
    _userCache.delete(firstKey);
  }
  _userCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Dùng khi user update profile/avatar để flush cache ngay
function invalidateUserCache(userId) {
  for (const [token, entry] of _userCache.entries()) {
    if (entry.user.id === userId) _userCache.delete(token);
  }
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token.startsWith('testpilot_token_')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token format' });
  }

  const parts = token.split('_');
  const userId = parts[2];
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: malformed token' });
  }

  // Cache hit — không cần gọi DB
  const cached = getCachedUser(token);
  if (cached) {
    req.user = cached;
    return next();
  }

  const user = await findById(userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: user not found' });
  }

  setCachedUser(token, user);
  req.user = user;
  next();
}

module.exports = { authMiddleware, invalidateUserCache };
