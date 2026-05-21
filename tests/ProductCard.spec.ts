import { test, expect } from '@playwright/test';


test.describe('ProductCard', () => {

test('Check Button Visibility', async ({ page }) => {
  await page.goto('${base_url}/product');
  const button = page.locator('.btn.btn-outline-primary.w-100.fw-semibold');
  expect(button).toBeVisible();
});

  test('Test Button Click Event', async ({ page }) => {
    await page.goto('${base_url}/product');
    const button = page.locator('.btn.btn-outline-primary.w-100.fw-semibold');
    await button.click();
    // Add assertion for expected event trigger
  });

  test('Check Button Interactivity', async ({ page }) => {
    await page.goto('${base_url}/product');
    const button = page.locator('.btn.btn-outline-primary.w-100.fw-semibold');
    expect(button).toBeEnabled();
  });

  test('Check Button Visibility with Dependencies', async ({ page }) => {
    await page.goto('${base_url}/product');
    const button = page.locator('.btn.btn-outline-primary.w-100.fw-semibold');
    expect(button).toBeVisible();
  });

  test('Check Button Visibility without Conditional Rendering', async ({ page }) => {
    await page.goto('${base_url}/product');
    const button = page.locator('.btn.btn-outline-primary.w-100.fw-semibold');
    expect(button).toBeVisible();
  });

});
