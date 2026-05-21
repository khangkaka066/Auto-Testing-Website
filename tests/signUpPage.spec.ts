// signUpPage.spec.ts
import { test, expect } from '@playwright/test';

// TC001: Verify Page Accessibility

test('TC001 - Verify Page Accessibility', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/signup`);
  const title = await page.title();
  expect(title).toBe('Sign Up');
});

// TC002: Verify Input Fields Existence

test('TC002 - Verify Input Fields Existence', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/signup`);
  const fullNameInput = await page.locator('#fullName');
  expect(fullNameInput).toBeVisible();
  const emailInput = await page.locator('#email');
  expect(emailInput).toBeVisible();
  const passwordInput = await page.locator('#password');
  expect(passwordInput).toBeVisible();
});

// TC003: Verify Error Message for Empty Fields

test('TC003 - Verify Error Message for Empty Fields', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/signup`);
  const submitButton = await page.locator('#submitButton');
  await submitButton.click();
  const errorMessages = await page.locator('.error-message').allTextContents();
  expect(errorMessages).toContain('Full name is required.');
  expect(errorMessages).toContain('Email is required.');
  expect(errorMessages).toContain('Password is required.');
});

// TC004: Verify Error Message for Invalid Email Format

test('TC004 - Verify Error Message for Invalid Email Format', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/signup`);
  const fullNameInput = await page.locator('#fullName');
  await fullNameInput.fill('John Doe');
  const emailInput = await page.locator('#email');
  await emailInput.fill('invalid-email.com');
  const passwordInput = await page.locator('#password');
  await passwordInput.fill('Password123');
  const submitButton = await page.locator('#submitButton');
  await submitButton.click();
  const errorMessage = await page.locator('.error-message').textContent();
  expect(errorMessage).toContain('Invalid email format.');
});

// TC005: Verify Error Message for Weak Password

test('TC005 - Verify Error Message for Weak Password', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/signup`);
  const fullNameInput = await page.locator('#fullName');
  await fullNameInput.fill('John Doe');
  const emailInput = await page.locator('#email');
  await emailInput.fill('john.doe@example.com');
  const passwordInput = await page.locator('#password');
  await passwordInput.fill('123');
  const submitButton = await page.locator('#submitButton');
  await submitButton.click();
  const errorMessage = await page.locator('.error-message').textContent();
  expect(errorMessage).toContain('Password is too weak.');
});

// TC006: Verify Successful Submission

test('TC006 - Verify Successful Submission', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/signup`);
  const fullNameInput = await page.locator('#fullName');
  await fullNameInput.fill('John Doe');
  const emailInput = await page.locator('#email');
  await emailInput.fill('john.doe@example.com');
  const passwordInput = await page.locator('#password');
  await passwordInput.fill('Password123');
  const submitButton = await page.locator('#submitButton');
  await submitButton.click();
  const successMessage = await page.locator('.success-message').textContent();
  expect(successMessage).toContain('Sign up successful.');
});
