import { test, expect } from '@playwright/test';

const baseURL = 'http://localhost:3000';

// Test case P0-1: Go back button presence and clickability
test('should have the go back button and be clickable', async ({ page }) => {
  await page.goto(baseURL + '/product/details/1');
  const goBackButton = page.locator('.btn.btn-outline-secondary.mb-4.shadow-sm');

  // Check if the button is visible
  expect(await goBackButton.isVisible()).toBe(true);

  // Click on the 'Go back' button
  await goBackButton.click();

  // TODO: Add assertions to verify navigation behavior
});

// Test case P1-2: Add to cart or contact for purchase button presence and clickability
test('should have the add to cart or contact for purchase button and be clickable', async ({ page }) => {
  await page.goto(baseURL + '/product/details/1');
  const addToCartButton = page.locator('.btn.btn-lg.w-100.py-3.fw-bold.shadow-sm');

  // Check if the button is visible
  expect(await addToCartButton.isVisible()).toBe(true);

  // Click on the 'Add to cart or contact for purchase' button
  await addToCartButton.click();

  // TODO: Add assertions to verify navigation behavior
});
