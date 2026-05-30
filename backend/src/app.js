const express = require('express');
const cors = require('cors');
const path = require('path');
const { CORS_ORIGINS } = require('./config/env');
const apiRoutes = require('./api/index');
const { errorMiddleware } = require('./middleware/error');

const app = express();

const corsOrigins = CORS_ORIGINS === '*' ? '*' : CORS_ORIGINS.split(',').map(s => s.trim());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, '..', 'static')));

app.get('/',       (req, res) => res.json({ message: 'TestPilot Backend is running' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', apiRoutes);

app.use(errorMiddleware);

module.exports = app;
