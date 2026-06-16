const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const { rateLimit } = require('express-rate-limit');
const { CORS_ORIGINS } = require('./config/env');
const apiRoutes = require('./api/index');
const { errorMiddleware } = require('./middleware/error');

const app = express();
app.set("trust proxy", 1);
// Nén response — giảm băng thông ~70% cho JSON responses
app.use(compression());

const corsOrigins = CORS_ORIGINS === '*' ? '*' : CORS_ORIGINS.split(',').map(s => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/static', express.static(path.join(__dirname, '..', 'static'), {
  maxAge: '7d', // cache static files tại browser 7 ngày
}));

// Rate limit chung: 300 req/phút mỗi IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please slow down.' },
});

// Rate limit chặt hơn cho auth: 20 lần/15 phút mỗi IP (chống brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

app.use(globalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

app.get('/',       (req, res) => res.json({ message: 'TestPilot Backend is running' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', apiRoutes);
app.use('/auth/github', require('./api/github/github.routes'));

app.use(errorMiddleware);

module.exports = app;
