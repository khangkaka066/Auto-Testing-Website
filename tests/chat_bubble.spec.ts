import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

const toggleButtonSelector = '.btn.btn-sm.btn-outline-secondary';
const messageInputSelector = '.form-control.form-control-sm.mb-2';
const submitButtonSelector = '.btn.btn-primary.btn-sm.w-100';
const errorMessageSelector = '.alert.alert-danger';

test.describe('ChatBubble Component', () => {
  test('Check if Chat Bubble can be toggled via button click', async ({ page }) => {
    await page.goto(BASE_URL);

    // Toggle chat bubble
    await page.click(toggleButtonSelector);

    // Verify chat bubble is visible
    const chatBubble = await page.locator('.chat-bubble');
    expect(await chatBubble.isVisible()).toBeTruthy();

    // Toggle chat bubble again
    await page.click(toggleButtonSelector);

    // Verify chat bubble is hidden
    expect(await chatBubble.isVisible()).toBeFalsy();
  });

  test('Check if user can enter a message in the input field and submit it using the button', async ({ page }) => {
    await page.goto(BASE_URL);

    // Enter a message
    const messageInput = await page.locator(messageInputSelector);
    await messageInput.type('Hello, World!');

    // Submit the message
    await page.click(submitButtonSelector);
  });

  test('Check if user can submit a message using the button', async ({ page }) => {
    await page.goto(BASE_URL);

    // Enter a message
    const messageInput = await page.locator(messageInputSelector);
    await messageInput.type('Hello, World!');

    // Submit the message
    await page.click(submitButtonSelector);
  });

  test('Check if Chat Bubble closes after submitting a message', async ({ page }) => {
    await page.goto(BASE_URL);

    // Enter a message
    const messageInput = await page.locator(messageInputSelector);
    await messageInput.type('Hello, World!');

    // Submit the message
    await page.click(submitButtonSelector);

    // Verify chat bubble is hidden
    const chatBubble = await page.locator('.chat-bubble');
    expect(await chatBubble.isVisible()).toBeFalsy();
  });

  test('Check if Chat Bubble reopens after toggling it back on', async ({ page }) => {
    await page.goto(BASE_URL);

    // Toggle chat bubble
    await page.click(toggleButtonSelector);

    // Verify chat bubble is visible
    const chatBubble = await page.locator('.chat-bubble');
    expect(await chatBubble.isVisible()).toBeTruthy();

    // Toggle chat bubble again
    await page.click(toggleButtonSelector);

    // Verify chat bubble is hidden
    expect(await chatBubble.isVisible()).toBeFalsy();
  });

  test('Check if Chat Bubble displays an error message when the input field is empty and submit button is clicked', async ({ page }) => {
    await page.goto(BASE_URL);

    // Submit the message without entering a message
    await page.click(submitButtonSelector);

    // Verify error message is displayed
    const errorMessage = await page.locator(errorMessageSelector);
    expect(await errorMessage.isVisible()).toBeTruthy();
  });
});
