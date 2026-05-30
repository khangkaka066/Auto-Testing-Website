const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { PORT } = require('../../config/env');
const { findByEmail, findById, save, updateById } = require('../../lib/userStore');
const { getUserStats } = require('../../lib/tokenTracker');
const supabase = require('../../lib/supabase');

async function logAuth(action, status, email, userId = null, req = null) {
  try {
    await supabase.from('auth_logs').insert([{
      user_id: userId || null,
      email: email || null,
      action,
      status,
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || null,
      user_agent: req?.headers?.['user-agent'] || null,
    }]);
  } catch (_) {}
}

function makeToken(userId) {
  return `testpilot_token_${userId}_${uuidv4().slice(0, 8)}`;
}

async function register(req, res) {
  const { email, password, name } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  if (await findByEmail(email)) {
<<<<<<< HEAD
    await logAuth('register', 'failed', email, null, req);
=======
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const userId = uuidv4();
  await save(email, {
    id: userId,
    name: name || email.split('@')[0],
    email: email.trim(),
    password_hash: await bcrypt.hash(password, 10),
  });

<<<<<<< HEAD
  await logAuth('register', 'success', email, userId, req);
  const user = await findByEmail(email);
=======
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: makeToken(userId),
    user: { id: userId, name: name || email.split('@')[0], email },
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  const user = await findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    await logAuth('login', 'failed', email, user?.id || null, req);
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  await logAuth('login', 'success', email, user.id, req);
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
    if (parts.length < 3) return res.status(400).json({ success: false, message: 'Invalid Google token format' });

    // Decode JWT payload với padding chuẩn
    const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = raw + '='.repeat((4 - raw.length % 4) % 4);
    let payload;
    try {
      payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
    } catch {
      return res.status(400).json({ success: false, message: 'Cannot decode Google token payload' });
    }

    const { email, name, sub: googleId } = payload;
    if (!email) return res.status(400).json({ success: false, message: 'Cannot get email from Google token' });

<<<<<<< HEAD
    console.log(`[Google Auth] email=${email}, name=${name}`);

    let user = await findByEmail(email);
    if (!user) {
      const userId = uuidv4();
      const { error: saveError } = await supabase.from('users').insert([{
=======
    if (!(await findByEmail(email))) {
      const userId = uuidv4();
      await save(email, {
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
        id: userId,
        name: name || email.split('@')[0],
        email,
        password_hash: await bcrypt.hash(uuidv4(), 10),
        created_at: new Date().toISOString(),
      }]);

      if (saveError) {
        console.error('[Google Auth] Insert user failed:', saveError.message);
        return res.status(500).json({ success: false, message: `Cannot create account: ${saveError.message}` });
      }

      user = await findByEmail(email);
      if (!user) {
        return res.status(500).json({ success: false, message: 'User created but could not be retrieved' });
      }
    }

<<<<<<< HEAD
    await logAuth('google_login', 'success', user.email, user.id, req);
=======
    const user = await findByEmail(email);
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
    return res.json({
      success: true,
      message: 'Google login successful',
      token: makeToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('[Google Auth] Error:', err.message);
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
<<<<<<< HEAD

  const supabase = require('../../lib/supabase');
  const updateData = { name: name.trim() };
  if (password?.trim()) {
    updateData.password_hash = await bcrypt.hash(password, 10);
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', req.user.id);
  if (error) return res.status(400).json({ success: false, message: error.message });

  return res.json({ success: true, message: 'Profile updated', user: { name: updateData.name, email: req.user.email } });
=======
  const changes = { name: name.trim() };
  if (password?.trim()) {
    changes.password_hash = await bcrypt.hash(password, 10);
  }
  await updateById(req.user.id, changes);
  Object.assign(req.user, changes);
  return res.json({ success: true, message: 'Profile updated', user: { name: req.user.name, email: req.user.email } });
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
}

function uploadAvatar(upload) {
  return (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

      const host = req.headers.host || `localhost:${PORT}`;
      const protocol = req.protocol || 'http';
      const avatarUrl = `${protocol}://${host}/static/avatars/${req.file.filename}`;
<<<<<<< HEAD

      const supabase = require('../../lib/supabase');
      await supabase.from('users').update({ avatar: avatarUrl }).eq('id', req.user.id);

=======
      await updateById(req.user.id, { avatar: avatarUrl });
      req.user.avatar = avatarUrl;
>>>>>>> 0f7d8957a5161ceb9cae559cf902edbe21368745
      return res.json({ success: true, message: 'Avatar uploaded', avatar_url: avatarUrl });
    });
  };
}

async function getStats(req, res) {
  const stats = await getUserStats(req.user.id);
  return res.json({ success: true, data: stats });
}

module.exports = { register, login, googleAuth, getProfile, updateProfile, uploadAvatar, getStats };
