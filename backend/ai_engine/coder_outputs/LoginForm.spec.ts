import { test, expect } from '@playwright/test';

// UI-001: Validate successful login with valid credentials
test('Validate successful login with valid credentials', async ({ page }) => {
  // Navigate to the page URL where the LoginForm is rendered.
  await page.goto('/login');

  // Verify that the email input element is present and enabled.
  const emailInput = await page.locator('input[data-testid="email-input"]');
  expect(emailInput).toBeVisible();
  expect(emailInput).toBeEnabled();

  // Type the email value 'test@example.com' into the email input field.
  await emailInput.type('test@example.com');

  // Verify that the email input's value attribute equals 'test@example.com'.
  expect(await emailInput.getAttribute('value')).toBe('test@example.com');

  // Verify that the password input element is present and enabled.
  const passwordInput = await page.locator('input[data-testid="password-input"]');
  expect(passwordInput).toBeVisible();
  expect(passwordInput).toBeEnabled();

  // Type the password value 'Password123' into the password input field.
  await passwordInput.type('Password123');

  // Verify that the password input's value attribute equals 'Password123' and that the input type remains masked.
  expect(await passwordInput.getAttribute('value')).toBe('Password123');
  expect(passwordInput).toHaveAttribute('type', 'password');

  // Verify that the login button is enabled.
  const loginButton = await page.locator('button[data-testid="login-button"]');
  expect(loginButton).toBeVisible();
  expect(loginButton).toBeEnabled();

  // Click the login button.
  await loginButton.click();

  // Verify that the form submission results in navigation to the expected dashboard page or displays a success message.
  const dashboardLink = await page.locator('a[href="/dashboard"]');
  expect(dashboardLink).toBeVisible();
});
