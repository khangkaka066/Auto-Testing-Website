import { test, expect } from '@playwright/test';

test('Kiểm tra kết nối mạng', async ({ page }) => {
  await page.goto('https://google.com');
  await expect(page).toHaveTitle(/.*/);
});