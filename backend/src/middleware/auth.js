const { findById } = require('../lib/userStore');

<<<<<<< HEAD
=======
async function getUserByToken(token) {
  if (!token?.startsWith('testpilot_mock_token_')) return null;
  const parts = token.split('_');
  if (parts.length < 4) return null;
  return findById(parts[3]);
}

>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
  }
<<<<<<< HEAD

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
=======
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
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
}

module.exports = { authMiddleware };
