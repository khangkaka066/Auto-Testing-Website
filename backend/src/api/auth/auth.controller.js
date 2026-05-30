const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { PORT } = require('../../config/env');
const { findByEmail, findById, save } = require('../../lib/userStore');
const { getUserStats } = require('../../lib/tokenTracker');

function makeToken(userId) {
  return `testpilot_token_${userId}_${uuidv4().slice(0, 8)}`;
}

async function register(req, res) {
  const { email, password, name } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  if (await findByEmail(email)) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const userId = uuidv4();
  await save(email, {
    id: userId,
    name: name || email.split('@')[0],
    email: email.trim(),
    password_hash: await bcrypt.hash(password, 10),
  });

  const user = await findByEmail(email);
  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: makeToken(userId),
    user: { id: userId, name: user.name, email },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  const user = await findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  return res.json({
    success: true,
    message: 'Login successful',
    token: makeToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  });
}

async function googleAuth(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Missing Google token' });

    const parts = token.split('.');
    if (parts.length < 2) return res.status(400).json({ success: false, message: 'Invalid Google token' });

    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const { email, name } = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
    if (!email) return res.status(400).json({ success: false, message: 'Cannot get email from Google token' });

    let user = await findByEmail(email);
    if (!user) {
      const userId = uuidv4();
      await save(email, {
        id: userId,
        name: name || email.split('@')[0],
        email,
        password_hash: await bcrypt.hash(uuidv4(), 10),
      });
      user = await findByEmail(email);
    }

    return res.json({
      success: true,
      message: 'Google login successful',
      token: makeToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: `Google auth error: ${err.message}` });
  }
}

function getProfile(req, res) {
  const { name, email, avatar } = req.user;
  return res.json({ success: true, user: { name, email, avatar: avatar || '' } });
}

async function updateProfile(req, res) {
  const { name, password } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'Name cannot be empty' });
  }

  const supabase = require('../../lib/supabase');
  const updateData = { name: name.trim() };
  if (password?.trim()) {
    updateData.password_hash = await bcrypt.hash(password, 10);
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', req.user.id);
  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Profile updated', user: { name: updateData.name, email: req.user.email } });
}

function uploadAvatar(upload) {
  return (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

      const host = req.headers.host || `localhost:${PORT}`;
      const protocol = req.protocol || 'http';
      const avatarUrl = `${protocol}://${host}/static/avatars/${req.file.filename}`;

      const supabase = require('../../lib/supabase');
      await supabase.from('users').update({ avatar: avatarUrl }).eq('id', req.user.id);

      return res.json({ success: true, message: 'Avatar uploaded', avatar_url: avatarUrl });
    });
  };
}

function getStats(req, res) {
  const stats = getUserStats(req.user.id);
  return res.json({ success: true, data: stats });
}

module.exports = { register, login, googleAuth, getProfile, updateProfile, uploadAvatar, getStats };
