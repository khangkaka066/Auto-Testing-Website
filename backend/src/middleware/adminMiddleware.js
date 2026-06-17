const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@123456,testpilotadmin@gmail.com').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

function adminMiddleware(req, res, next) {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const isAdmin = user.is_admin === true || ADMIN_EMAILS.includes((user.email || '').toLowerCase());
  if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden: admin only' });

  next();
}

module.exports = { adminMiddleware };
