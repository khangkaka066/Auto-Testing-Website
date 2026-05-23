import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe(`ProductCard`, () => {
  const buttonSelector = ".btn.btn-outline-primary.w-100.fw-semibold";

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("domcontentloaded");
  });

  test(`P01 - Check Button Visibility`, async ({ page }) => {
    const btn = page.locator(buttonSelector);
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test(`P02 - Test Button Click Event`, async ({ page }) => {
    // Install a page-side flag to detect the click event
    await page.evaluate((sel) => {
      (window as any).__pw_clicked = false;
      const btn = document.querySelector(sel);
      if (btn) {
        btn.addEventListener("click", function () {
          (window as any).__pw_clicked = true;
        });
      }
    }, buttonSelector);

    // Perform a real user action
    await page.click(buttonSelector);

    // Verify the page-side flag was set by the click handler
    const clicked = await page.evaluate(() => {
      return Boolean((window as any).__pw_clicked);
    });

    await expect(clicked).toBe(true);
  });

  test(`P03 - Check Button Interactivity`, async ({ page }) => {
    const btn = page.locator(buttonSelector);
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();

    // Try clicking to ensure it is clickable (no errors) and remains enabled
    await btn.click();
    await expect(btn).toBeEnabled();
  });

  test(`P04 - Check Button Visibility with Dependencies`, async ({ page }) => {
    // This test ensures the button renders in an environment where router/react
    // dependencies would normally be present. The app under test is expected
    // to provide those dependencies; we simply verify the UI element.
    const btn = page.locator(buttonSelector);
    await expect(btn).toBeVisible();
  });

  test(`P05 - Check Button Visibility without Conditional Rendering`, async ({ page }) => {
    // Verify the button is present when no conditional rendering hides it.
    const btn = page.locator(buttonSelector);
    await expect(btn).toBeVisible();
  });

});
