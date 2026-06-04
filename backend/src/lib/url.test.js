const assert = require('assert');
const { joinUrl } = require('./url');

assert.strictEqual(
  joinUrl('https://auto-testing-website.onrender.com/', '/api/auth/verify?token=abc'),
  'https://auto-testing-website.onrender.com/api/auth/verify?token=abc'
);

assert.strictEqual(
  joinUrl('https://auto-testing-website.onrender.com', '/api/auth/verify?token=abc'),
  'https://auto-testing-website.onrender.com/api/auth/verify?token=abc'
);

assert.strictEqual(
  joinUrl('http://localhost:3000/', '/login?verified=true'),
  'http://localhost:3000/login?verified=true'
);

console.log('url helper tests passed');
