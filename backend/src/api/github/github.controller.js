const axios = require('axios');
const crypto = require('crypto');
const { findById } = require('../../lib/userStore');
const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  GITHUB_CALLBACK_URL,
  FRONTEND_URL,
} = require('../../config/env');

// Lưu tạm state → userId để xác thực callback (xóa sau 10 phút)
const pendingStates = new Map();

function redirectToGithub(req, res) {
  const userId = req.user.id;
  if (!GITHUB_CLIENT_ID) {
    return res.status(503).json({ success: false, message: 'GitHub OAuth not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, { userId, expiresAt: Date.now() + 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
    scope: 'repo read:user',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}

async function handleCallback(req, res) {
  const { code, state } = req.query;

  const pending = pendingStates.get(state);
  if (!pending || pending.expiresAt < Date.now()) {
    pendingStates.delete(state);
    return res.redirect(`${FRONTEND_URL}/dashboard?github=error&reason=invalid_state`);
  }
  pendingStates.delete(state);

  try {
    // Exchange code → access token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: GITHUB_CALLBACK_URL },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token, error } = tokenRes.data;
    if (error || !access_token) {
      return res.redirect(`${FRONTEND_URL}/dashboard?github=error&reason=${error || 'no_token'}`);
    }

    // Lấy thông tin GitHub user
    const profileRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'TestPilot' },
    });

    const user = findById(pending.userId);
    if (user) {
      user.github_token = access_token;
      user.github_login = profileRes.data.login;
      user.github_avatar = profileRes.data.avatar_url;
    }

    res.redirect(`${FRONTEND_URL}/dashboard?github=connected&login=${profileRes.data.login}`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/dashboard?github=error&reason=${encodeURIComponent(err.message)}`);
  }
}

function getGithubStatus(req, res) {
  const { github_token, github_login, github_avatar } = req.user;
  return res.json({
    success: true,
    data: {
      connected: !!github_token,
      login: github_login || null,
      avatar: github_avatar || null,
    },
  });
}

async function listRepos(req, res) {
  const { github_token } = req.user;
  if (!github_token) {
    return res.status(403).json({ success: false, message: 'GitHub not connected' });
  }

  try {
    // Lấy tất cả repo (public + private) của user, sắp xếp theo lần push gần nhất
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${github_token}`, 'User-Agent': 'TestPilot' },
      params: { per_page: 100, sort: 'pushed', affiliation: 'owner,collaborator,organization_member' },
    });

    const repos = response.data.map(r => ({
      id: r.id,
      full_name: r.full_name,
      name: r.name,
      owner: r.owner.login,
      private: r.private,
      description: r.description,
      default_branch: r.default_branch,
      pushed_at: r.pushed_at,
      url: r.clone_url,
    }));

    return res.json({ success: true, data: repos });
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      // Token hết hạn, xóa
      req.user.github_token = null;
      req.user.github_login = null;
      return res.status(401).json({ success: false, message: 'GitHub token expired. Please reconnect.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function listBranches(req, res) {
  const { github_token } = req.user;
  if (!github_token) return res.status(403).json({ success: false, message: 'GitHub not connected' });

  const { owner, repo } = req.params;
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: { Authorization: `Bearer ${github_token}`, 'User-Agent': 'TestPilot' },
        params: { per_page: 100 },
      }
    );
    return res.json({ success: true, data: response.data.map(b => b.name) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { redirectToGithub, handleCallback, getGithubStatus, listRepos, listBranches };
