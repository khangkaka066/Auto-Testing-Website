import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Test case 1001: Verify Sign Up Button
async function verifySignUpButton(page) {
  // Navigate to the base URL
  await page.goto(BASE_URL);

  // Check if the 'Sign up' button is visible and enabled
  const signUpButton = page.locator('button:text("Sign up")');
  expect(signUpButton).toBeVisible();
  expect(signUpButton).not.toBeDisabled();

  // Optionally, you can click on the button and check for navigation or other actions
  // await signUpButton.click();
}

test('Verify Sign Up Button', async ({ page }) => {
  await verifySignUpButton(page);
});

// Test case 1002: Verify Log In Button
async function verifyLogInButton(page) {
  // Navigate to the base URL
  await page.goto(BASE_URL);

  // Check if the 'Log in' button is visible and enabled
  const logInButton = page.locator('button:text("Log in")');
  expect(logInButton).toBeVisible();
  expect(logInButton).not.toBeDisabled();

  // Optionally, you can click on the button and check for navigation or other actions
  // await logInButton.click();
}

test('Verify Log In Button', async ({ page }) => {
  await verifyLogInButton(page);
});
