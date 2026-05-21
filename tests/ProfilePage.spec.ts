import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// P001 ProfileSidebar Presence and Visibility

test('ProfileSidebar Presence and Visibility', async ({ page }) => {
  await page.goto(BASE_URL + '/profile');
  expect(await page.isVisible('#profile-sidebar')).toBe(true);
});

// P002 ProfileForm Presence and Visibility

test('ProfileForm Presence and Visibility', async ({ page }) => {
  await page.goto(BASE_URL + '/profile');
  expect(await page.isVisible('#profile-form')).toBe(true);
});

// P003 Initial State of ProfileForm

test('Initial State of ProfileForm', async ({ page }) => {
  await page.goto(BASE_URL + '/profile');
  const firstNameInput = page.locator('#first-name-input');
  const lastNameInput = page.locator('#last-name-input');
  expect(await firstNameInput.getAttribute('value')).toBe('');
  expect(await lastNameInput.getAttribute('value')).toBe('');
});

// P004 Validation Messages for Required Fields

test('Validation Messages for Required Fields', async ({ page }) => {
  await page.goto(BASE_URL + '/profile');
  await page.fill('#first-name-input', '');
  await page.fill('#last-name-input', '');
  await page.click('#submit-button');
  expect(await page.isVisible('#error-message-firstName')).toBe(true);
  expect(await page.isVisible('#error-message-lastName')).toBe(true);
});

// P005 Submit Valid Data in ProfileForm

test('Submit Valid Data in ProfileForm', async ({ page }) => {
  await page.goto(BASE_URL + '/profile');
  await page.fill('#first-name-input', 'John');
  await page.fill('#last-name-input', 'Doe');
  await page.click('#submit-button');
  expect(await page.isVisible('#success-message')).toBe(true);
});
