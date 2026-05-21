import { test, expect } from '@playwright/test';

const base_url = 'http://localhost:3000';

// TC001: Navigation Link Presence
async function TC001({ page }) {
  await page.goto(base_url);
  const linkText = "Privacy Policy";
  const linkElement = await page.locator(`a:text('${linkText}')`);
  expect(linkElement).toBeVisible();
}

test.describe('Footer', () => {
  test('TC001 Navigation Link Presence', async ({ page }) => {
    await TC001(page);
  });
});

// TC002: Navigation Link Clickability
async function TC002({ page }) {
  await page.goto(base_url);
  const linkText = "Privacy Policy";
  const linkElement = await page.locator(`a:text('${linkText}')`);
  expect(linkElement).toBeVisible();
  expect(linkElement).not.toBeDisabled();
  await linkElement.click();
}

const timeout = 5000; // Set an appropriate timeout for the click action

if (process.env.NODE_ENV === 'test') {
  test.setTimeout(timeout);
}

test.describe('Footer', () => {
  test('TC002 Navigation Link Clickability', async ({ page }) => {
    await TC002(page);
  });
});
