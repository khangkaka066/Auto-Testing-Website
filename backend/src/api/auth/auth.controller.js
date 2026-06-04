const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { PORT, GOOGLE_CLIENT_ID, FRONTEND_URL } = require('../../config/env');
const { findByEmail, findById } = require('../../lib/userStore');
const { getUserStats } = require('../../lib/tokenTracker');
const { invalidateUserCache } = require('../../middleware/auth');
const { sendMail } = require('../../lib/mailer');
const { welcomeEmail, loginNotificationEmail } = require('../../lib/emailTemplates');
const { joinUrl } = require('../../lib/url');
const supabase = require('../../lib/supabase');
const { sendVerificationEmail, sendWelcomeEmail } = require('../../lib/email');

// Kiểm tra lịch sử đăng nhập và gửi email phù hợp (chạy bất đồng bộ, không block response)
async function handleLoginEmail(user, req) {
  try {
    const ip = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || req?.socket?.remoteAddress
      || req?.ip
      || '';
    const ua = req?.headers?.['user-agent'] || '';
    const now = new Date().toISOString();

    // Đếm số lần đăng nhập thành công trước đây (không tính lần này)
    const { count } = await supabase
      .from('auth_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action', 'login')
      .eq('status', 'success');

    const isFirstLogin = !count || count === 0;

    if (isFirstLogin) {
      await sendMail({
        to: user.email,
        subject: '🚀 Chào mừng đến với TestPilot!',
        html: welcomeEmail({ name: user.name, email: user.email }),
      });
    } else {
      await sendMail({
        to: user.email,
        subject: '🔐 Đăng nhập mới vào tài khoản TestPilot',
        html: loginNotificationEmail({ name: user.name, email: user.email, ip, ua, time: now }),
      });
    }
  } catch (err) {
    console.error('[handleLoginEmail] error:', err.message);
  }
}

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

async function createVerificationToken(userId, email) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const { error } = await supabase.from('email_verifications').insert([{
    user_id: userId,
    email,
    token,
    expires_at: expiresAt.toISOString(),
  }]);

  if (error) throw new Error(`Failed to create verification token: ${error.message}`);
  return token;
}

async function register(req, res) {
  const { email, password, name } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  if (await findByEmail(email)) {
    await logAuth('register', 'failed', email, null, req);
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const userId = uuidv4();
  const displayName = name?.trim() || email.split('@')[0];

  const { error: insertError } = await supabase.from('users').insert([{
    id: userId,
    name: displayName,
    email: email.trim(),
    password_hash: await bcrypt.hash(password, 10),
    credits: 500_000,
    email_verified: false,
    created_at: new Date().toISOString(),
  }]);

  if (insertError) {
    console.error('[Register] Insert error:', insertError);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }

  await logAuth('register', 'success', email, userId, req);

  try {
    const verifyToken = await createVerificationToken(userId, email.trim());
    await sendVerificationEmail(email.trim(), displayName, verifyToken);
  } catch (emailErr) {
    console.error('[Register] Email error:', emailErr.message);
  }

  return res.status(201).json({
    success: true,
    requiresVerification: true,
    message: 'Email xác thực đã được gửi! Vui lòng kiểm tra hộp thư để hoàn tất đăng ký.',
  });
}

async function verifyEmail(req, res) {
  const { token } = req.query;
  const frontendUrl = FRONTEND_URL || 'http://localhost:3000';

  if (!token) {
    return res.redirect(joinUrl(frontendUrl, '/login?error=missing_token'));
  }

  const { data: verification, error } = await supabase
    .from('email_verifications')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !verification) {
    return res.redirect(joinUrl(frontendUrl, '/login?error=invalid_token'));
  }

  if (verification.verified_at) {
    // Already verified — just send them to login
    return res.redirect(joinUrl(frontendUrl, '/login?verified=true'));
  }

  if (new Date(verification.expires_at) < new Date()) {
    return res.redirect(joinUrl(frontendUrl, '/login?error=token_expired'));
  }

  await supabase
    .from('email_verifications')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', verification.id);

  await supabase
    .from('users')
    .update({ email_verified: true })
    .eq('id', verification.user_id);

  const user = await findById(verification.user_id);
  if (user) {
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailErr) {
      console.error('[Verify] Welcome email error:', emailErr.message);
    }
  }

  await logAuth('email_verified', 'success', verification.email, verification.user_id, req);

  return res.redirect(joinUrl(frontendUrl, '/login?verified=true'));
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

  // Block unverified email/password users (only if explicitly false — null/undefined = old user, let through)
  if (user.email_verified === false) {
    return res.status(403).json({
      success: false,
      requiresVerification: true,
      message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
    });
  }

  await logAuth('login', 'success', email, user.id, req);
  // Gửi email bất đồng bộ — không làm chậm response
  setImmediate(() => handleLoginEmail(user, req));
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

    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return res.status(401).json({ success: false, message: 'Google token has expired' });
    }

    console.log(`[Google Auth] email=${email}, name=${name}`);

    let user = await findByEmail(email);
    const isNewUser = !user;

    if (!user) {
      const userId = uuidv4();
      const displayName = name || email.split('@')[0];
      const { error: insertError } = await supabase.from('users').insert([{
        id: userId,
        name: displayName,
        email,
        password_hash: await bcrypt.hash(uuidv4(), 10),
        credits: 500_000,
        email_verified: true, // Google already verified the email
        created_at: new Date().toISOString(),
      }]);
      if (insertError) {
        console.error('[Google Auth] Supabase insert error:', insertError);
        throw new Error(`Failed to create user: ${insertError.message}`);
      }
      user = await findByEmail(email);
      if (!user) throw new Error('User created but could not be retrieved');
    }

    if (isNewUser) {
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailErr) {
        console.error('[Google Auth] Welcome email error:', emailErr.message);
      }
    }

    await logAuth('google_login', 'success', user.email, user.id, req);
    setImmediate(() => handleLoginEmail(user, req));
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

function getGoogleClientConfig(req, res) {
  return res.json({
    success: true,
    google_client_id: GOOGLE_CLIENT_ID,
  });
}

async function updateProfile(req, res) {
  const { name, password } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'Name cannot be empty' });
  }

  const updateData = { name: name.trim() };
  if (password?.trim()) {
    updateData.password_hash = await bcrypt.hash(password, 10);
  }

  const { error } = await supabase.from('users').update(updateData).eq('id', req.user.id);
  if (error) return res.status(400).json({ success: false, message: error.message });

  invalidateUserCache(req.user.id);
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

      await supabase.from('users').update({ avatar: avatarUrl }).eq('id', req.user.id);

      return res.json({ success: true, message: 'Avatar uploaded', avatar_url: avatarUrl });
    });
  };
}

async function getStats(req, res) {
  const stats = await getUserStats(req.user.id);
  return res.json({ success: true, data: stats });
}

module.exports = {
  register,
  verifyEmail,
  login,
  googleAuth,
  getGoogleClientConfig,
  getProfile,
  updateProfile,
  uploadAvatar,
  getStats,
};
