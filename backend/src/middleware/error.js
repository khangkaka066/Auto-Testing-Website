const { AI_DEBUG } = require('../config/env');

function errorMiddleware(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const body = { success: false, message: err.message || 'Internal server error' };
  if (AI_DEBUG) body.stack = err.stack;
  res.status(status).json(body);
}

module.exports = { errorMiddleware };
