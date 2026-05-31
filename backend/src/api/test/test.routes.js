const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../../middleware/auth');
const ctrl = require('./test.controller');
const { WORKSPACE_BASE_PATH } = require('../../config/env');

const router = express.Router();

function safePathSegment(value, fallback = 'user') {
  return String(value || '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^[._-]+|[._-]+$/g, '') || fallback;
}

const sourceZipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(path.resolve(WORKSPACE_BASE_PATH), safePathSegment(req.user.id), 'projects');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uuidv4()}-${safe}`);
  },
});

const sourceUpload = multer({
  storage: sourceZipStorage,
  limits: { files: 1, fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.zip') {
      return cb(new Error('Please upload a .zip file'));
    }
    cb(null, true);
  },
});

router.post('/upload-source', authMiddleware, (req, res, next) => {
  sourceUpload.single('sourceZip')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    ctrl.uploadSource(req, res).catch(next);
  });
});

router.post('/history',            authMiddleware, ctrl.addTestHistory);
router.get('/history',             authMiddleware, ctrl.getTestHistory);
router.get('/dashboard-stats',     authMiddleware, (req, res, next) => ctrl.getTestDashboardStats(req, res).catch(next));
router.post('/run',                authMiddleware, (req, res, next) => ctrl.startTest(req, res).catch(next));
router.post('/run-github',         authMiddleware, (req, res, next) => ctrl.startTestFromGithub(req, res).catch(next));
router.get('/run/:project_id',     authMiddleware, ctrl.getTestStatus);

module.exports = router;
