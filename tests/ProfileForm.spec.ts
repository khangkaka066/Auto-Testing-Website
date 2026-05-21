import { test, expect } from '@playwright/test';


test.describe('ProfileForm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Full Name Input Field', async ({ page }) => {
    await expect(page.locator('[name="fullname"]')).toBeVisible();
    await page.fill('[name="fullname"]', 'John Doe');
    await expect(await page.inputValue('[name="fullname"]')).toBe('John Doe');
  });

  test('Email Input Field', async ({ page }) => {
    await expect(page.locator('[name="email"]')).toBeVisible();
    await page.fill('[name="email"]', 'john.doe@example.com');
    await expect(await page.inputValue('[name="email"]')).toBe('john.doe@example.com');
  });

  test('Phone Input Field', async ({ page }) => {
    await expect(page.locator('[name="phone"]')).toBeVisible();
    await page.fill('[name="phone"]', '123-456-7890');
    await expect(await page.inputValue('[name="phone"]')).toBe('123-456-7890');
  });

  test('Bio Textarea Field', async ({ page }) => {
    await expect(page.locator('[name="bio"]')).toBeVisible();
    await page.fill('[name="bio"]', 'This is a bio text.');
    await expect(await page.inputValue('[name="bio"]')).toBe('This is a bio text.');
  });

  test('Save Changes Button', async ({ page }) => {
    await page.fill('[name="fullname"]', 'John Doe');
    await page.fill('[name="email"]', 'john.doe@example.com');
    await page.fill('[name="phone"]', '123-456-7890');
    await page.fill('[name="bio"]', 'This is a bio text.');

    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeVisible();
    await saveButton.click();
  });
});
