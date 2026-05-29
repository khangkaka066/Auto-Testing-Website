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

// Cấu hình lưu source code người dùng upload vào workspaces/<user_id>
const SOURCE_WORKSPACE_DIR = path.resolve(__dirname, '..', '..', 'workspaces');

function ensureWorkspaceRoot() {
  fs.mkdirSync(SOURCE_WORKSPACE_DIR, { recursive: true });
  return SOURCE_WORKSPACE_DIR;
}

ensureWorkspaceRoot();

const sourceZipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userSourcesDir = path.join(ensureWorkspaceRoot(), req.user.id, 'sources');
    fs.mkdirSync(userSourcesDir, { recursive: true });
    cb(null, userSourcesDir);
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

function removeUploadedZip(zipPath) {
  if (!zipPath) return false;

  try {
    fs.rmSync(zipPath, {
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
    return true;
  } catch (err) {
    console.warn(`Không thể xóa file zip tạm ${zipPath}: ${err.message}`);
    return false;
  }
}

function removeDirectory(directoryPath) {
  if (!directoryPath) return false;

  try {
    fs.rmSync(directoryPath, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 100,
    });
    return true;
  } catch (err) {
    console.warn(`Không thể xóa thư mục ${directoryPath}: ${err.message}`);
    return false;
  }
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

function formatRunTimestamp(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return [
    `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`,
    `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`,
  ].join('_');
}

function sanitizePathName(value) {
  return (value || 'source_project')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '') || 'source_project';
}

function isPathInside(childPath, parentPath) {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

function createPreparedRun(userId, sourcePath) {
  const workspaceRoot = ensureWorkspaceRoot();
  const userWorkspaceDir = path.join(workspaceRoot, userId);
  const sourcesRootDir = path.join(userWorkspaceDir, 'sources');
  const runsRootDir = path.join(userWorkspaceDir, 'runs');
  const resolvedSourcePath = path.resolve(sourcePath);

  if (!isPathInside(resolvedSourcePath, sourcesRootDir)) {
    throw new Error('source_path không nằm trong thư mục sources của user');
  }

  if (!fs.existsSync(resolvedSourcePath) || !fs.statSync(resolvedSourcePath).isDirectory()) {
    throw new Error(`source_path không tồn tại hoặc không phải thư mục: ${sourcePath}`);
  }

  fs.mkdirSync(runsRootDir, { recursive: true });

  const sourceName = sanitizePathName(path.basename(resolvedSourcePath));
  const baseRunFolderName = `run_${formatRunTimestamp()}_${sourceName}`;
  let runFolderName = baseRunFolderName;
  let runWorkspaceDir = path.join(runsRootDir, runFolderName);
  let duplicateIndex = 2;
  while (fs.existsSync(runWorkspaceDir)) {
    runFolderName = `${baseRunFolderName}_${duplicateIndex}`;
    runWorkspaceDir = path.join(runsRootDir, runFolderName);
    duplicateIndex += 1;
  }
  const stageDirs = [
    '1_detector',
    '2_analyzer',
    '3_planner',
    '4_filter',
    '5_coder',
    '5.5_validator',
    '6_executor',
    '7_reporter',
  ];

  fs.mkdirSync(runWorkspaceDir, { recursive: true });
  const createdStageDirs = stageDirs.map(stageDir => {
    const stagePath = path.join(runWorkspaceDir, stageDir);
    fs.mkdirSync(stagePath, { recursive: true });
    return stagePath;
  });

  return {
    run_id: runFolderName,
    source_name: sourceName,
    source_path: resolvedSourcePath,
    workspace_path: userWorkspaceDir,
    runs_path: runsRootDir,
    run_workspace_dir: runWorkspaceDir,
    stage_dirs: createdStageDirs,
  };
}

function buildPreparedRunResponse(preparedRun) {
  return {
    ...preparedRun,
    relative_run_workspace_dir: path.relative(ensureWorkspaceRoot(), preparedRun.run_workspace_dir),
    relative_stage_dirs: preparedRun.stage_dirs.map(stageDir => path.relative(ensureWorkspaceRoot(), stageDir)),
  };
}

function formatDisplayTimestamp(dateInput = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', '');
}

function parseHealthScore(finalReport) {
  const rawScore = finalReport && finalReport.health_score;
  if (typeof rawScore === 'number') return Math.max(0, Math.min(100, rawScore));
  const match = String(rawScore || '').match(/\d+/);
  return match ? Math.max(0, Math.min(100, Number(match[0]))) : null;
}

function findHistoryRecordByJob(jobData) {
  return TEST_HISTORY_DB.find(record =>
    record.job_id === jobData.job_id ||
    (record.project_id === jobData.project_id && record.user_id === jobData.user_id)
  );
}

function createOrUpdateTestHistory(jobData, fallback = {}) {
  if (!jobData || (!jobData.job_id && !jobData.project_id)) return null;

  const sourceName = sanitizePathName(path.basename(jobData.source_path || fallback.source_path || fallback.project_id || 'source_project'));
  const startedAt = jobData.started_at || fallback.started_at || jobData.created_at || new Date().toISOString();
  const result = jobData.result || {};
  const finalReport = result.final_report || null;
  const healthScore = parseHealthScore(finalReport);
  let record = findHistoryRecordByJob(jobData);

  if (!record) {
    record = {
      id: uuidv4(),
      user_id: jobData.user_id || fallback.user_id,
      job_id: jobData.job_id,
      run_id: jobData.run_id || null,
      project_id: jobData.project_id || fallback.project_id,
      source_name: sourceName,
      source_path: jobData.source_path || fallback.source_path || '',
      status: jobData.status || 'queued',
      started_at: startedAt,
      started_at_display: formatDisplayTimestamp(startedAt),
      finished_at: null,
      finished_at_display: '',
      health_score: null,
      summary: null,
      final_report_path: null,
      report: null,
    };
    TEST_HISTORY_DB.unshift(record);
  }

  record.job_id = jobData.job_id || record.job_id;
  record.run_id = jobData.run_id || record.run_id;
  record.project_id = jobData.project_id || record.project_id;
  record.status = jobData.status || record.status;
  record.source_path = jobData.source_path || record.source_path;
  record.source_name = sourceName || record.source_name;
  record.started_at = jobData.started_at || record.started_at;
  record.started_at_display = formatDisplayTimestamp(record.started_at);

  if (jobData.status === 'completed' || jobData.status === 'failed') {
    record.finished_at = jobData.finished_at || new Date().toISOString();
    record.finished_at_display = formatDisplayTimestamp(record.finished_at);
  }

  if (result.final_report_path) record.final_report_path = result.final_report_path;
  if (finalReport) {
    record.report = finalReport;
    record.health_score = healthScore;
    record.summary = finalReport.summary || null;
  }

  return record;
}

function readReportForHistory(record) {
  if (!record) return null;
  if (record.report) return record.report;
  if (!record.final_report_path || !fs.existsSync(record.final_report_path)) return null;

  const report = JSON.parse(fs.readFileSync(record.final_report_path, 'utf-8'));
  record.report = report;
  record.health_score = parseHealthScore(report);
  record.summary = report.summary || null;
  return report;
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

// --- UPLOAD FILE ZIP SOURCE CODE, LƯU VÀ GIẢI NÉN VÀO WORKSPACES CỦA USER ---
router.post('/test/upload-source', authMiddleware, (req, res) => {
  sourceUpload.single('sourceZip')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file source code dạng .zip' });
    }

    const userWorkspaceDir = path.join(ensureWorkspaceRoot(), req.user.id);
    const sourceRootDir = path.join(userWorkspaceDir, 'sources');
    fs.mkdirSync(sourceRootDir, { recursive: true });

    const extractDir = buildUniqueProjectSourceDir(sourceRootDir, req.file.originalname);
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      const zipEntries = validateZipEntries(req.file.path);

      let zipDeleted = false;

      try {
        execFileSync('unzip', ['-q', '-o', req.file.path, '-d', extractDir], {
          stdio: 'pipe',
          maxBuffer: 10 * 1024 * 1024,
        });
      } catch (unzipError) {
        removeDirectory(extractDir);
        return res.status(400).json({
          success: false,
          message: `Không thể giải nén file zip: ${unzipError.message}`,
        });
      } finally {
        zipDeleted = removeUploadedZip(req.file.path);
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
          zip_deleted: zipDeleted,
        },
      });
    } catch (validationError) {
      removeUploadedZip(req.file.path);
      removeDirectory(extractDir);
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }
  });
});

// --- LƯU LỊCH SỬ CHẠY TEST ---
router.post('/test/history', authMiddleware, (req, res) => {
  const { filename, source_name, source_path, project_id } = req.body;
  const displayName = source_name || project_id || filename;
  if (!displayName) {
    return res.status(400).json({ success: false, message: 'Tên source không được để trống' });
  }

  const record = {
    id: uuidv4(),
    user_id: req.user.id,
    source_name: sanitizePathName(displayName),
    source_path: source_path || '',
    project_id: project_id || sanitizePathName(displayName),
    status: 'uploaded',
    started_at: new Date().toISOString(),
    started_at_display: formatDisplayTimestamp(),
    finished_at: null,
    finished_at_display: '',
    health_score: null,
    summary: null,
    final_report_path: null,
    report: null,
  };

  TEST_HISTORY_DB.unshift(record); // Chèn đầu danh sách, mới nhất lên trên

  return res.json({ success: true, data: record });
});

// --- LẤY LỊCH SỬ TEST CỦA USER ---
router.get('/test/history', authMiddleware, (req, res) => {
  const userHistory = TEST_HISTORY_DB.filter(r => r.user_id === req.user.id);
  return res.json({ success: true, data: userHistory });
});

// --- LẤY BÁO CÁO TEST TỪ LỊCH SỬ ---
router.get('/test/report/:history_id', authMiddleware, (req, res) => {
  const record = TEST_HISTORY_DB.find(item =>
    item.user_id === req.user.id &&
    (item.id === req.params.history_id || item.job_id === req.params.history_id || item.run_id === req.params.history_id)
  );
  if (!record) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lịch sử test' });
  }

  try {
    const report = readReportForHistory(record);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Báo cáo chưa sẵn sàng hoặc không tồn tại' });
    }

    return res.json({
      success: true,
      data: {
        history: record,
        report,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: `Không thể đọc báo cáo: ${err.message}` });
  }
});

// --- TEST TẠO RUN WORKSPACE, CHƯA CHẠY AI PIPELINE ---
router.post('/test/prepare-run', authMiddleware, (req, res) => {
  const { source_path } = req.body;

  if (!source_path) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin: source_path' });
  }

  try {
    const preparedRun = createPreparedRun(req.user.id, source_path);
    return res.json({
      success: true,
      message: 'Đã tạo run workspace test, chưa chạy AI pipeline',
      data: buildPreparedRunResponse(preparedRun),
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
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

    if (response.data && response.data.data) {
      createOrUpdateTestHistory(response.data.data, {
        user_id,
        project_id,
        source_path,
      });
    }

    return res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(502).json({
        success: false,
        message: `AI service chưa chạy tại ${AI_PYTHON_URL}. Hãy chạy: cd backend/api_node && npm run start:ai`,
      });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: 'AI service xử lý quá lâu và đã timeout, vui lòng thử lại sau',
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
    if (response.data && response.data.data) {
      createOrUpdateTestHistory(response.data.data);
    }
    return res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(502).json({
        success: false,
        message: `AI service chưa chạy tại ${AI_PYTHON_URL}. Hãy chạy: cd backend/api_node && npm run start:ai`,
      });
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
