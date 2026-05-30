const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TestPilot backend running at http://0.0.0.0:${PORT}`);
});

module.exports = app;
