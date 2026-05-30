// File: backend/utils/playwright_template.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Code sinh ra sẽ nằm ở thư mục tests/ bên ngoài
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  
  // BẮT BUỘC: Ép Playwright xuất file JSON để Agent Reporter đọc được
  reporter: [
    ['line'],
    ['json', { outputFile: 'playwright-report.json' }]
  ],
  
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // THÔNG MINH: Tự động khởi động App của khách hàng dựa trên biến môi trường
  webServer: [
    {
      command: 'npm install && npm run dev', 
      cwd: process.env.FRONTEND_DIR || './', // Tự động trỏ vào workspace của khách!
      url: process.env.BASE_URL || 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    }
  ]
});