const { findById } = require('../lib/userStore');

async function getUserByToken(token) {
  if (!token?.startsWith('testpilot_mock_token_')) return null;
  const parts = token.split('_');
  if (parts.length < 4) return null;
  return findById(parts[3]);
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
  }
  try {
    const user = await getUserByToken(authHeader.replace('Bearer ', '').trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Auth error: ' + err.message });
  }
}

module.exports = { authMiddleware };
