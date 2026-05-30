const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../../middleware/auth');
const ctrl = require('./auth.controller');

const router = express.Router();

const AVATAR_DIR = path.join(__dirname, '..', '..', '..', 'static', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('File must be an image'));
    cb(null, true);
  },
});

router.post('/register',          ctrl.register);
router.post('/login',             ctrl.login);
router.post('/google',            ctrl.googleAuth);
router.get('/google-client-config', ctrl.getGoogleClientConfig);
router.get('/profile',  authMiddleware, ctrl.getProfile);
router.put('/profile',  authMiddleware, ctrl.updateProfile);
router.post('/avatar',  authMiddleware, ctrl.uploadAvatar(avatarUpload));
router.get('/stats',    authMiddleware, ctrl.getStats);

module.exports = router;
