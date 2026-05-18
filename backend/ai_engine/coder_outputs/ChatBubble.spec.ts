import { test, expect } from '@playwright/test';

// TC003: Reject Empty Message Submission
test('Reject Empty Message Submission', async ({ page }) => {
  await page.goto("http://localhost:3000/ChatBubble");
  const toggleButton = await page.locator("button.btn.btn-primary.rounded-circle.d-flex.justify-content-center.align-items-center");
  if (await toggleButton.isVisible()) {
    await toggleButton.click();
  }

  const inputField = await page.locator("input.form-control.form-control-sm.mb-2");
  expect(inputField).toBeVisible().and.toBeEditable();

  await inputField.fill(""); // Enter an empty string into the input field

  const submitButton = await page.locator("button.btn.btn-primary.btn-sm.w-100");
  expect(submitButton).toBeEnabled();
  await submitButton.click();

  // Mock the ../api/chatApi endpoint to verify no request is made
  // (This is an example; actual implementation depends on your test setup)

  const validationMessage = await page.locator(".validation-message");
  expect(validationMessage).toBeVisible();
});
