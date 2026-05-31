const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const ctrl = require('./github.controller');

const router = express.Router();

// OAuth flow — dùng token từ query param vì đây là browser redirect
const { findById } = require('../../lib/userStore');
router.get('/connect', async (req, res, next) => {
  const token = req.query._token || req.headers['authorization']?.replace('Bearer ', '').trim();
  if (!token?.startsWith('testpilot_token_')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  // token format: testpilot_token_{uuid}_{random8}
  const parts = token.split('_');
  const userId = parts.slice(2, parts.length - 1).join('_');
  const user = userId ? await findById(userId) : null;
  if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
  req.user = user;
  next();
}, ctrl.redirectToGithub);
router.get('/callback',            ctrl.handleCallback);           // GitHub gọi về đây (không cần auth header)

// Data endpoints
router.get('/status',              authMiddleware, ctrl.getGithubStatus);
router.get('/repos',               authMiddleware, ctrl.listRepos);
router.get('/repos/:owner/:repo/branches', authMiddleware, ctrl.listBranches);

module.exports = router;
