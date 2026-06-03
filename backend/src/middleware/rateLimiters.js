const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

function testRunKeyGenerator(req) {
  if (req.user && req.user.id) return `user:${req.user.id}`;
  return req.headers['authorization'] || ipKeyGenerator(req.ip);
}

// Rate limit for starting test runs only. Keep status polling out of this bucket.
const testRunLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: testRunKeyGenerator,
  skipFailedRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many test runs. Wait a few minutes before starting another.' },
});

module.exports = { testRunLimiter, testRunKeyGenerator };
