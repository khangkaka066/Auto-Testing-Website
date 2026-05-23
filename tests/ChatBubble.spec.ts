import { test, expect } from '@playwright/test';

const BASE_URL = `http://localhost:5173`;
const TOGGLE_BUTTON_SELECTOR = `.btn.btn-sm.btn-outline-secondary`;
const MESSAGE_INPUT_SELECTOR = `.form-control.form-control-sm.mb-2`;
const SUBMIT_BUTTON_SELECTOR = `.btn.btn-primary.btn-sm.w-100`;

test.describe(`ChatBubble`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test(`TC001 - Check if Chat Bubble can be toggled via button click`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_BUTTON_SELECTOR);
    const input = page.locator(MESSAGE_INPUT_SELECTOR);

    await expect(toggle).toBeVisible();

    // Click to open the chat bubble
    await toggle.click();
    await expect(input).toBeVisible();

    // Click again to close the chat bubble
    await toggle.click();
    await expect(input).not.toBeVisible();
  });

  test(`TC002 - Check if user can enter a message in the input field and submit it using the button`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_BUTTON_SELECTOR);
    const input = page.locator(MESSAGE_INPUT_SELECTOR);
    const submit = page.locator(SUBMIT_BUTTON_SELECTOR);

    // Ensure chat is open
    if (!(await input.isVisible())) {
      await toggle.click();
      await expect(input).toBeVisible();
    }

    const message = `Hello from Playwright`;
    await input.fill(message);
    await expect(input).toHaveValue(message);

    // Submit should be enabled and clickable
    await expect(submit).toBeEnabled();
    await submit.click();

    // After submit, either the chat closes or the input is cleared. Assert one of them.
    if (await input.isVisible()) {
      await expect(input).toHaveValue(``);
    } else {
      await expect(input).not.toBeVisible();
    }
  });

  test(`TC003 - Check if user can submit a message using the button`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_BUTTON_SELECTOR);
    const input = page.locator(MESSAGE_INPUT_SELECTOR);
    const submit = page.locator(SUBMIT_BUTTON_SELECTOR);

    // Open chat if needed
    if (!(await input.isVisible())) {
      await toggle.click();
      await expect(input).toBeVisible();
    }

    const message = `Test message for submit button`;
    await input.fill(message);
    await expect(input).toHaveValue(message);

    // Click submit and ensure the action completes (no uncaught errors)
    await expect(submit).toBeEnabled();
    await submit.click();

    // Verify post-submit state: either closed or input cleared
    if (await input.isVisible()) {
      await expect(input).toHaveValue(``);
    } else {
      await expect(input).not.toBeVisible();
    }
  });

  test(`TC004 - Check if Chat Bubble closes after submitting a message`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_BUTTON_SELECTOR);
    const input = page.locator(MESSAGE_INPUT_SELECTOR);
    const submit = page.locator(SUBMIT_BUTTON_SELECTOR);

    // Open chat if needed
    if (!(await input.isVisible())) {
      await toggle.click();
      await expect(input).toBeVisible();
    }

    await input.fill(`Message that will close the bubble`);
    await expect(submit).toBeEnabled();
    await submit.click();

    // Expect the chat bubble to close after submitting
    await expect(input).not.toBeVisible();
  });

  test(`TC005 - Check if Chat Bubble reopens after toggling it back on`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_BUTTON_SELECTOR);
    const input = page.locator(MESSAGE_INPUT_SELECTOR);

    // Ensure chat is closed first: if open, close it
    if (await input.isVisible()) {
      await toggle.click();
      await expect(input).not.toBeVisible();
    }

    // Toggle back on and verify it reopens
    await toggle.click();
    await expect(input).toBeVisible();
  });

  test(`TC006 - Check if Chat Bubble displays an error message when the input field is empty and submit button is clicked`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_BUTTON_SELECTOR);
    const input = page.locator(MESSAGE_INPUT_SELECTOR);
    const submit = page.locator(SUBMIT_BUTTON_SELECTOR);

    // Open chat if needed
    if (!(await input.isVisible())) {
      await toggle.click();
      await expect(input).toBeVisible();
    }

    // Ensure input is empty
    await input.fill(``);
    await expect(input).toHaveValue(``);

    // Click submit with empty input
    await expect(submit).toBeEnabled();
    await submit.click();

    // Verify UI indicates an error for empty input.
    // Common patterns: input may get 'is-invalid' class or aria-invalid attribute.
    const classAttr = await input.getAttribute(`class`);
    const ariaInvalid = await input.getAttribute(`aria-invalid`);

    if (classAttr) {
      expect(classAttr.includes(`is-invalid`) || classAttr.includes(`is-danger`)).toBeTruthy();
    }

    if (ariaInvalid !== null) {
      expect(ariaInvalid).toBe(`true`);
    }

    // As a fallback, assert that either class or aria-invalid indicates validation state
    expect((classAttr && (classAttr.includes(`is-invalid`) || classAttr.includes(`is-danger`))) || ariaInvalid === `true`).toBeTruthy();
  });
});
