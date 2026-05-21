import { test, expect } from '@playwright/test';

// TC001: Check if Chat Bubble can be toggled via button click
test('TC001', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const toggleButton = await page.locator('.btn.btn-sm.btn-outline-secondary');
  await expect(toggleButton).toBeVisible();

  // Toggle the chat bubble
  await toggleButton.click();
  await expect(page.locator('.chat-bubble')).toHaveClass(/hidden/);

  // Re-toggle the chat bubble
  await toggleButton.click();
  await expect(page.locator('.chat-bubble')).not.toHaveClass(/hidden/);
});

// TC002: Check if user can enter a message in the input field and submit it using the button
test('TC002', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const messageInput = await page.locator('.form-control.form-control-sm.mb-2');
  await expect(messageInput).toBeVisible();

  // Enter a message
  await messageInput.type('Hello, World!');
  await expect(messageInput).toHaveValue('Hello, World!');
});

// TC003: Check if user can submit a message using the button
test('TC003', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const submitButton = await page.locator('.btn.btn-primary.btn-sm.w-100');
  await expect(submitButton).toBeVisible();

  // Click the submit button
  await submitButton.click();
});

// TC004: Check if Chat Bubble closes after submitting a message (TODO: Verify chat bubble closes)
test('TC004', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const messageInput = await page.locator('.form-control.form-control-sm.mb-2');
  await expect(messageInput).toBeVisible();

  // Enter a message
  await messageInput.type('Hello, World!');
  await expect(messageInput).toHaveValue('Hello, World!');

  const submitButton = await page.locator('.btn.btn-primary.btn-sm.w-100');
  await expect(submitButton).toBeVisible();

  // Click the submit button
  await submitButton.click();

  // TODO: Verify chat bubble closes
});

// TC005: Check if Chat Bubble reopens after toggling it back on (TODO: Verify chat bubble reopens)
test('TC005', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const toggleButton = await page.locator('.btn.btn-sm.btn-outline-secondary');
  await expect(toggleButton).toBeVisible();

  // Toggle the chat bubble
  await toggleButton.click();
  await expect(page.locator('.chat-bubble')).toHaveClass(/hidden/);

  // Re-toggle the chat bubble
  await toggleButton.click();
  await expect(page.locator('.chat-bubble')).not.toHaveClass(/hidden/);

  // TODO: Verify chat bubble reopens
});

// TC006: Check if Chat Bubble displays an error message when the input field is empty and submit button is clicked (TODO: Verify error message)
test('TC006', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const submitButton = await page.locator('.btn.btn-primary.btn-sm.w-100');
  await expect(submitButton).toBeVisible();

  // Click the submit button without entering a message
  await submitButton.click();

  // TODO: Verify error message is displayed
});
