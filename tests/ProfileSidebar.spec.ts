import { test, expect } from '@playwright/test';


test('Cancel Logout Test', async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Assuming the logout button has a class 'logout-button'
  const logoutButton = page.locator('.logout-button');

  // Simulate clicking the logout button
  await logoutButton.click();

  // Verify visibility of the confirmation modal
  const confirmModal = page.locator('.confirm-modal');
  expect(await confirmModal.isVisible()).toBe(true);

  // Assuming 'No' button in the modal has a class 'no-button'
  const noButton = confirmModal.locator('.no-button');
  await noButton.click();

  // Additional steps to verify cancellation of logout can be added here
});
