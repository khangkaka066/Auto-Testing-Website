// File: backend/utils/playwright_template.config.ts
import { defineConfig, devices } from '@playwright/test';

const frontendInstallCommand = process.env.FRONTEND_INSTALL_COMMAND;
const frontendStartCommand = process.env.FRONTEND_COMMAND;
const frontendDir = process.env.FRONTEND_DIR;
const frontendUrl = process.env.BASE_URL || process.env.FRONTEND_URL;
const frontendCommand = [frontendInstallCommand, frontendStartCommand].filter(Boolean).join(' && ');
const webServer = process.env.PLAYWRIGHT_MANAGED_SERVICES !== 'true' && frontendCommand && frontendDir && frontendUrl
  ? [
      {
        command: frontendCommand,
        cwd: frontendDir,
        url: frontendUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
    ]
  : undefined;

export default defineConfig({
  testDir: './tests', // Code sinh ra sẽ nằm ở thư mục tests/ bên ngoài
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 2,
  workers: process.env.CI ? 1 : 1,
  
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

  webServer,
});
