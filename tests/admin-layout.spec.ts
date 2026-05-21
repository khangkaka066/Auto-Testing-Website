import { test, expect } from '@playwright/test';

// Logout Button Test

test('AdminLayout - Logout Button Test', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/admin`);
  const logoutButton = page.locator('[data-testid="logout-button"]');
  await expect(logoutButton).toBeVisible();
  await logoutButton.click();
  // Assuming login page is redirected after logout
  const LoginPageTitle = page.locator('h1:text("Login")');
  await expect(LoginPageTitle).toBeVisible();
});

// AdminLayout Responsive Test

test.describe('AdminLayout - Responsive Tests', () => {
  test.beforeEach(async ({ browser, context }) => {
    const viewport = { width: 375, height: 812 };
    const page = await browser.newPage({ viewport });
    await context.addInitScript(`window.innerWidth = ${viewport.width}; window.innerHeight = ${viewport.height};`);
  });

  test('AdminLayout Mobile View', async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/admin`);
    const mobileViewElement = page.locator('[data-testid="mobile-view"]');
    await expect(mobileViewElement).toBeVisible();
  });

  test('AdminLayout Tablet View', async ({ browser, context }) => {
    const viewport = { width: 768, height: 1024 };
    const page = await browser.newPage({ viewport });
    await context.addInitScript(`window.innerWidth = ${viewport.width}; window.innerHeight = ${viewport.height};`);
    await page.goto(`${process.env.BASE_URL}/admin`);
    const tabletViewElement = page.locator('[data-testid="tablet-view"]');
    await expect(tabletViewElement).toBeVisible();
  });

  test('AdminLayout Desktop View', async ({ browser, context }) => {
    const viewport = { width: 1280, height: 720 };
    const page = await browser.newPage({ viewport });
    await context.addInitScript(`window.innerWidth = ${viewport.width}; window.innerHeight = ${viewport.height};`);
    await page.goto(`${process.env.BASE_URL}/admin`);
    const desktopViewElement = page.locator('[data-testid="desktop-view"]');
    await expect(desktopViewElement).toBeVisible();
  });
});

// AdminLayout Navigation Test

test('AdminLayout - Navigation Test', async ({ page }) => {
  await page.goto(`${process.env.BASE_URL}/`);
  const adminLink = page.locator('[href="/admin"]');
  await expect(adminLink).toBeVisible();
  await adminLink.click();
  const AdminPageTitle = page.locator('h1:text("Admin")');
  await expect(AdminPageTitle).toBeVisible();
});
