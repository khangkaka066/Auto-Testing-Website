import { test, expect } from '@playwright/test';


test.describe('BuildPCPage', () => {
  const baseUrl = 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('Validate Modal Open Functionality', async ({ page }) => {
    await page.click('.modal-open-button');
    const modal = page.locator('.modal');
    expect(modal).toBeVisible();
  });

  test('Validate Item Removal Functionality', async ({ page }) => {
    await page.click('.selected-item-remove-button');
    await expect(page.locator('.selected-item')).toHaveCount(0);
  });

  test('Validate Clear All Functionality', async ({ page }) => {
    const itemCount = await page.locator('.selected-item').count();
    if (itemCount > 0) {
      await page.click('.clear-all-button');
      await expect(page.locator('.selected-item')).toHaveCount(0);
    }
  });

  test('Validate Add All to Cart Functionality', async ({ page }) => {
    const itemCount = await page.locator('.selected-item').count();
    if (itemCount > 0) {
      await page.click('.add-all-to-cart-button');
      // Add assertions for cart items
    }
  });

  test('Validate Disabled Clear All Button', async ({ page }) => {
    await expect(page.locator('.clear-all-button')).toBeDisabled();
  });

  test('Validate Disabled Add All Button', async ({ page }) => {
    await expect(page.locator('.add-all-to-cart-button')).toBeDisabled();
  });
});
