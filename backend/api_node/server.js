const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

// ====================================================================
// KHỞI TẠO SERVER VÀ KẾT NỐI DATABASE
// ====================================================================
const app = express();
const PORT = process.env.PORT || 5000;
const AI_PYTHON_URL = process.env.AI_PYTHON_URL || 'http://127.0.0.1:8001';
const AI_REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS || 30 * 60 * 1000);

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

let db;
if (mongoUrl) {
  MongoClient.connect(mongoUrl)
    .then(client => {
      db = client.db(dbName);
      console.log('Kết nối MongoDB thành công');
    })
    .catch(err => {
      console.error('Lỗi kết nối MongoDB:', err.message);
    });
} else {
  console.warn('MONGO_URL chưa được cấu hình, server sẽ dùng mock database trên RAM');
}

// Cấu hình thư mục chứa ảnh đại diện
const UPLOAD_DIR = path.join(__dirname, 'static', 'avatars');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Cấu hình Multer để xử lý upload file ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('File gửi lên bắt buộc phải là hình ảnh'));
    }
    cb(null, true);
  },
});

// Cấu hình lưu source code người dùng upload vào workspace/<user_id>
const SOURCE_WORKSPACE_DIR = path.resolve(__dirname, '..', '..', 'workspace');
fs.mkdirSync(SOURCE_WORKSPACE_DIR, { recursive: true });

const sourceZipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userUploadDir = path.join(SOURCE_WORKSPACE_DIR, req.user.id, 'uploads');
    fs.mkdirSync(userUploadDir, { recursive: true });
    cb(null, userUploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uuidv4()}-${safeName}`);
  },
});

const sourceUpload = multer({
  storage: sourceZipStorage,
  limits: {
    files: 1,
    fileSize: 200 * 1024 * 1024,
  },
  
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.zip') {
      return cb(new Error('Vui lòng tải lên file source code dạng .zip'));
    }
    cb(null, true);
  },
});

function safeRelativePath(inputPath) {
  const normalized = path
    .normalize(inputPath || '')
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^[/\\]+/, '');

  if (!normalized || path.isAbsolute(normalized) || normalized.split(path.sep).includes('..')) {
    return null;
  }

  return normalized;
}

function validateZipEntries(zipPath) {
  const output = execFileSync('unzip', ['-Z', '-1', zipPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });

  return output
    .split('\n')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map(entry => {
      const safePath = safeRelativePath(entry);
      if (!safePath) {
        throw new Error(`File zip chứa đường dẫn không hợp lệ: ${entry}`);
      }
      return safePath;
    });
}

function removeUserUploads(userId) {
  fs.rmSync(path.join(SOURCE_WORKSPACE_DIR, userId, 'uploads'), {
    recursive: true,
    force: true,
  });
}

function buildUniqueProjectSourceDir(sourceRootDir, zipFilename) {
  const rawName = path.basename(zipFilename, path.extname(zipFilename));
  const projectName = rawName
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '') || 'source_project';

  let projectSourceDir = path.join(sourceRootDir, projectName);
  if (fs.existsSync(projectSourceDir)) {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    projectSourceDir = path.join(sourceRootDir, `${projectName}_${timestamp}`);
  }

  return projectSourceDir;
}

// ====================================================================
// MIDDLEWARE
// ====================================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, 'static')));

const configuredCorsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['*'];
const corsOrigins = configuredCorsOrigins.includes('*') ? true : configuredCorsOrigins;
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// ====================================================================
// MOCK DATABASE (Lưu trên RAM khi chưa có MongoDB)
// ====================================================================
const USERS_DB = {};       // { email: { id, name, email, password_hash, avatar } }
const TEST_HISTORY_DB = []; // [ { id, user_id, filename, timestamp } ]

// Hàm giải mã Mock Token để lấy thông tin User
function getUserByToken(token) {
  if (!token || !token.startsWith('testpilot_mock_token_')) return null;
  const parts = token.split('_');
  if (parts.length < 4) return null;
  const userId = parts[3];
  return Object.values(USERS_DB).find(u => u.id === userId) || null;
}

// Middleware xác thực token
function authMiddleware(req, res, next) {
  const authorization = req.headers['authorization'];
  if (!authorization) {
    return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập' });
  }
  const token = authorization.replace('Bearer ', '').trim();
  const user = getUserByToken(token);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ' });
  }
  req.user = user;
  next();
}

// ====================================================================
// ROUTER /api
// ====================================================================
const router = express.Router();

// --- Root ---
router.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

// ====================================================================
// AUTH ENDPOINTS
// ====================================================================
// --- ĐĂNG KÝ ---
router.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !email.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email và mật khẩu không được để trống' });
  }
  if (USERS_DB[email]) {
    return res.status(400).json({ success: false, message: 'Email này đã được đăng ký tài khoản khác' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  USERS_DB[email] = {
    id: userId,
    name: name || email.split('@')[0],
    email,
    password_hash: passwordHash,
  };

  const mockToken = `testpilot_mock_token_${userId}_${uuidv4().slice(0, 8)}`;

  return res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản và Đăng nhập thành công!',
    token: mockToken,
    user: { id: userId, name: USERS_DB[email].name, email },
  });
});

// --- ĐĂNG NHẬP ---
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !email.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ cả Email và Mật khẩu' });
  }

  const user = USERS_DB[email];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
  }

  const mockToken = `testpilot_mock_token_${user.id}_${uuidv4().slice(0, 8)}`;

  return res.status(200).json({
    success: true,
    message: 'Đăng nhập hệ thống thành công!',
    token: mockToken,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// Alias route /api/auth/login (tương thích với Python version cũ)
router.post('/api/auth/login', async (req, res) => {
  // Gọi lại logic login (forward nội bộ)
  req.url = '/auth/login';
  router.handle(req, res);
});

// --- ĐĂNG NHẬP BẰNG GOOGLE ---
router.post('/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Mã xác thực Google không hợp lệ' });
    }

    const tokenParts = token.split('.');
    if (tokenParts.length < 2) {
      return res.status(400).json({ success: false, message: 'Mã xác thực Google không hợp lệ' });
    }

    // Giải mã Payload (phần thứ 2) của JWT
    const payloadB64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8');
    const idInfo = JSON.parse(payloadJson);

    const email = idInfo.email;
    const name = idInfo.name || (email ? email.split('@')[0] : 'Google User');

    if (!email) {
      return res.status(400).json({ success: false, message: 'Không thể lấy thông tin Email từ tài khoản Google này' });
    }

    
    let userId;
    if (!USERS_DB[email]) {
      userId = uuidv4();
      USERS_DB[email] = {
        id: userId,
        name,
        email,
        password_hash: await bcrypt.hash(uuidv4(), 10), // Mật khẩu ngẫu nhiên bảo mật
      };
    } else {
      userId = USERS_DB[email].id;
    }

    const mockToken = `testpilot_mock_token_${userId}_${uuidv4().slice(0, 8)}`;

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thông qua tài khoản Google thành công!',
      token: mockToken,
      user: { id: userId, name: USERS_DB[email].name, email },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: `Lỗi hệ thống khi xác thực Google: ${err.message}` });
  }
});

// --- LẤY THÔNG TIN CÁ NHÂN ---
router.get('/auth/profile', authMiddleware, (req, res) => {
  const user = req.user;
  return res.json({
    success: true,
    user: { name: user.name, email: user.email, avatar: user.avatar || '' },
  });
});

// --- CẬP NHẬT THÔNG TIN CÁ NHÂN ---
router.put('/auth/profile', authMiddleware, async (req, res) => {
  const { name, password } = req.body;
  const user = req.user;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Tên không được để trống' });
  }

  user.name = name.trim();

  if (password && password.trim()) {
    user.password_hash = await bcrypt.hash(password, 10);
  }

  return res.json({
    success: true,
    message: 'Cập nhật thông tin cá nhân thành công!',
    user: { name: user.name, email: user.email },
  });
});

// --- UPLOAD ẢNH ĐẠI DIỆN ---
router.post('/auth/avatar', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh để tải lên' });
    }

    const avatarUrl = `http://localhost:${PORT}/static/avatars/${req.file.filename}`;
    req.user.avatar = avatarUrl;

    return res.json({
      success: true,
      message: 'Tải ảnh đại diện thành công!',
      avatar_url: avatarUrl,
    });
  });
});

// ====================================================================
// TEST HISTORY ENDPOINTS
// ====================================================================

// --- UPLOAD FILE ZIP SOURCE CODE, LƯU VÀ GIẢI NÉN VÀO WORKSPACE CỦA USER ---
router.post('/test/upload-source', authMiddleware, (req, res) => {
  sourceUpload.single('sourceZip')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file source code dạng .zip' });
    }

    const userWorkspaceDir = path.join(SOURCE_WORKSPACE_DIR, req.user.id);
    const sourceRootDir = path.join(userWorkspaceDir, 'source');
    const extractDir = buildUniqueProjectSourceDir(sourceRootDir, req.file.originalname);
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      const zipEntries = validateZipEntries(req.file.path);

      try {
        execFileSync('unzip', ['-q', '-o', req.file.path, '-d', extractDir], {
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch (unzipError) {
        return res.status(400).json({
          success: false,
          message: `Không thể giải nén file zip: ${unzipError.message}`,
        });
      } finally {
        removeUserUploads(req.user.id);
      }

      return res.json({
        success: true,
        message: 'Upload và giải nén source code thành công',
        data: {
          user_id: req.user.id,
          project_id: path.basename(extractDir),
          workspace_path: userWorkspaceDir,
          source_path: extractDir,
          extracted_count: zipEntries.length,
          extracted_files: zipEntries,
          uploads_deleted: true,
        },
      });
    } catch (validationError) {
      removeUserUploads(req.user.id);
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }
  });
});

// --- LƯU LỊCH SỬ CHẠY TEST ---
router.post('/test/history', authMiddleware, (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ success: false, message: 'Tên file không được để trống' });
  }

  const now = new Date();
  const timestamp = now.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).replace(',', '');

  const record = {
    id: uuidv4(),
    user_id: req.user.id,
    filename,
    timestamp,
  };

  TEST_HISTORY_DB.unshift(record); // Chèn đầu danh sách, mới nhất lên trên

  return res.json({ success: true, data: record });
});

// --- LẤY LỊCH SỬ TEST CỦA USER ---
router.get('/test/history', authMiddleware, (req, res) => {
  const userHistory = TEST_HISTORY_DB.filter(r => r.user_id === req.user.id);
  return res.json({ success: true, data: userHistory });
});

// ====================================================================
// STATUS ENDPOINTS (Giữ nguyên từ bản cũ)
// ====================================================================

router.post('/status', async (req, res) => {
  const { client_name } = req.body;
  if (!client_name) {
    return res.status(400).json({ error: 'client_name là bắt buộc' });
  }

  const statusObj = {
    id: uuidv4(),
    client_name,
    timestamp: new Date().toISOString(),
  };

  try {
    if (db) await db.collection('status_checks').insertOne({ ...statusObj });
  } catch (err) {
    console.error('Lỗi lưu MongoDB:', err.message);
  }

  return res.json(statusObj);
});

router.get('/status', async (req, res) => {
  try {
    if (db) {
      const checks = await db.collection('status_checks').find({}, { projection: { _id: 0 } }).limit(1000).toArray();
      return res.json(checks);
    }
  } catch (err) {
    console.error('Lỗi đọc MongoDB:', err.message);
  }
  return res.json([]);
});

// ====================================================================
// AI PIPELINE ENDPOINT
// ====================================================================

router.post('/run-test', authMiddleware, async (req, res) => {
  const { user_id, project_id, source_path } = req.body;

  if (!user_id || !project_id || !source_path) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin: user_id, project_id, source_path' });
  }

  try {
    // Forward request sang AI Python service
    const response = await axios.post(
      `${AI_PYTHON_URL}/api/run-test`,
      { user_id, project_id, source_path },
      {
        headers: {
          'Content-Type': 'application/json',
          // Truyền token xác thực sang Python nếu cần
          'Authorization': req.headers['authorization'] || '',
        },
        timeout: AI_REQUEST_TIMEOUT_MS,
      }
    );

    return res.json(response.data);
  } catch (err) {
    // Lỗi timeout hoặc Python service không phản hồi
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      return res.status(502).json({
        success: false,
        message: 'AI service hiện không khả dụng, vui lòng thử lại sau',
      });
    }
    // Trả về lỗi từ Python nếu có
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    console.error('Lỗi gọi AI Python:', err.message);
    return res.status(500).json({ success: false, message: `Lỗi kết nối tới AI service: ${err.message}` });
  }
});

// --- LẤY KẾT QUẢ TEST TỪ AI PYTHON (Poll API) ---
router.get('/run-test/:project_id', authMiddleware, async (req, res) => {
  const { project_id } = req.params;

  try {
    const response = await axios.get(
      `${AI_PYTHON_URL}/api/run-test/${project_id}`,
      {
        headers: { 'Authorization': req.headers['authorization'] || '' },
        timeout: 10000,
      }
    );
    return res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(502).json({ success: false, message: 'AI service hiện không khả dụng' });
    }
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    return res.status(500).json({ success: false, message: `Lỗi kết nối tới AI service: ${err.message}` });
  }
});

// ====================================================================
// GẮN ROUTER VÀO APP VÀ KHỞI ĐỘNG SERVER
// ====================================================================
app.use('/api', router);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy tại http://0.0.0.0:${PORT}`);
  console.log(`AI Python service: ${AI_PYTHON_URL}`);
});

module.exports = app;
