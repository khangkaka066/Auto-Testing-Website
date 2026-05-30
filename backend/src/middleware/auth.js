const { findById } = require('../lib/userStore');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token.startsWith('testpilot_token_')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token format' });
  }

  // token format: testpilot_token_<uuid>_<suffix>
  const parts = token.split('_');
  const userId = parts[2];

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized: malformed token' });
  }

  const user = await findById(userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: user not found' });
  }

  req.user = user;
  next();
}

module.exports = { authMiddleware };
