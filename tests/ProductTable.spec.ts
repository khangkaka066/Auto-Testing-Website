import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:3000';

// TC001: Test Edit Product Button Functionality
test('TC001 - Verify that the 'Edit product' button is displayed and functional.', async ({ page }) => {
  await page.goto(baseUrl);
  const editButton = page.locator('.btn.btn-sm.btn-outline-primary');

  // Check if the button exists
  await expect(editButton).toBeVisible();

  // Click the button and check if it's functional
  await editButton.click();
  await expect(page.locator('#editModal')).toBeVisible(); // Assuming modal has an id of 'editModal'
});

// TC002: Test Delete Product Button Functionality
test('TC002 - Verify that the 'Delete product' button is displayed and functional.', async ({ page }) => {
  await page.goto(baseUrl);
  const deleteButton = page.locator('.btn.btn-sm.btn-outline-danger');

  // Check if the button exists
  await expect(deleteButton).toBeVisible();

  // Click the button and check if it's functional
  await deleteButton.click();
  await expect(page.locator('#deleteConfirmationModal')).toBeVisible(); // Assuming modal has an id of 'deleteConfirmationModal'
});

// TC003: Test Edit Product Modal Opening
test('TC003 - Verify that clicking 'Edit product' button opens the edit modal.', async ({ page }) => {
  await page.goto(baseUrl);
  const editButton = page.locator('.btn.btn-sm.btn-outline-primary');

  // Click the button and check if it's functional
  await editButton.click();
  await expect(page.locator('#editModal')).toBeVisible();
});

// TC004: Test Delete Product Confirmation Modal Opening
test('TC004 - Verify that clicking 'Delete product' button opens the delete confirmation modal.', async ({ page }) => {
  await page.goto(baseUrl);
  const deleteButton = page.locator('.btn.btn-sm.btn-outline-danger');

  // Click the button and check if it's functional
  await deleteButton.click();
  await expect(page.locator('#deleteConfirmationModal')).toBeVisible();
});
