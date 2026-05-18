import { defineConfig, devices } from '@playwright/test';

// Kiểm tra xem Python có truyền đường dẫn source code của user qua biến môi trường không
const USER_PROJECT_PATH = process.env.USER_PROJECT_PATH;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './backend/ai_engine/coder_outputs',
  timeout: 60 * 1000, // 60 giây cho 1 test case đề phòng ứng dụng nặng
  fullyParallel: true,
  reporter: [
    ['line'],
    ['json', { outputFile: './backend/ai_engine/runner_outputs/playwright-report.json' }]
  ],
  use: {
    baseUrl: BASE_URL,
    headless: true, // Chạy ẩn danh không cần bật cửa sổ UI
    ignoreHTTPSErrors: true,
  },

  /* TỰ ĐỘNG BẬT WEB CHO USER */
  webServer: USER_PROJECT_PATH ? {
    // Tự động chui vào folder user, cài đặt thư viện và chạy dev server trên port 5173
    command: `cd "${USER_PROJECT_PATH}" && npm install && npm run dev -- --port 5173`,
    url: 'http://localhost:5173',
    reuseExistingServer: false, // Luôn tạo server mới để đảm bảo tính cô lập
    timeout: 180 * 1000, // Cho hệ thống tối đa 3 phút để cài npm và build chạy thử web lần đầu
  } : undefined,

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
});