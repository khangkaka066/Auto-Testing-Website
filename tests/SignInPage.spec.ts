import { test, expect } from '@playwright/test';


test.describe('SignInPage', () => {

test('Email Input Visibility', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const emailInput = await page.locator('#email-input');
	expect(emailInput).toBeVisible();
	expect(emailInput).toBeEnabled();
});


test('Password Input Visibility', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const passwordInput = await page.locator('#password-input');
	expect(passwordInput).toBeVisible();
	expect(passwordInput).toBeEnabled();
});


test('Submit Button Visibility', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const submitButton = await page.locator('#submit-button');
	expect(submitButton).toBeVisible();
	expect(submitButton).toBeEnabled();
});


test('Sign Up Link Visibility', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const signUpLink = await page.locator('#sign-up-link');
	expect(signUpLink).toBeVisible();
});


test('Submit Button Functionality', async ({ page, context }) => {
	await page.goto('http://localhost:3000');
	const emailInput = await page.locator('#email-input');
	const passwordInput = await page.locator('#password-input');
	const submitButton = await page.locator('#submit-button');
	await emailInput.fill('example@test.com');
	await passwordInput.fill('Password123');
	await expect(page).toHaveURL('http://localhost:3000/home');
});


test('Sign Up Link Functionality', async ({ page, context }) => {
	await page.goto('http://localhost:3000');
	const signUpLink = await page.locator('#sign-up-link');
	await signUpLink.click();
	await expect(page).toHaveURL('http://localhost:3000/signup');
});


test('Email Input Validation', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const emailInput = await page.locator('#email-input');
	await emailInput.fill('');
	const errorMessage = await page.locator('#error-message');
	expect(errorMessage).toBeVisible();
});


test('Password Input Validation', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const passwordInput = await page.locator('#password-input');
	await passwordInput.fill('');
	const errorMessage = await page.locator('#error-message');
	expect(errorMessage).toBeVisible();
});


test('Submit Button Disabled State', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const emailInput = await page.locator('#email-input');
	const submitButton = await page.locator('#submit-button');
	await emailInput.fill('');
	expect(submitButton).toBeDisabled();
});


test('Submit Button Enabled State', async ({ page }) => {
	await page.goto('http://localhost:3000');
	const emailInput = await page.locator('#email-input');
	const passwordInput = await page.locator('#password-input');
	const submitButton = await page.locator('#submit-button');
	await emailInput.fill('example@test.com');
	await passwordInput.fill('Password123');
	expect(submitButton).toBeEnabled();
});

});
