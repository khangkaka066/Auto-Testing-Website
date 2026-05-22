import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const BUTTON_SELECTOR = ".btn.btn-outline-primary.w-100.fw-semibold";

test.describe("ProductCard", () => {
  test(`Check Button Visibility`, async ({ page }) => {
    await page.goto(BASE_URL);
    const btn = page.locator(BUTTON_SELECTOR);
    await expect(btn).toBeVisible();
    await expect(btn).toBeAttached();
    await expect(btn).toHaveText(/Add to cart/i);
  });

  test(`Test Button Click Event`, async ({ page }) => {
    await page.goto(BASE_URL);

    await page.evaluate((sel) => {
      (window as any).__p02Clicked = false;
      const el = document.querySelector(sel);
      if (el) {
        el.addEventListener("click", () => {
          (window as any).__p02Clicked = true;
        });
      }
    }, BUTTON_SELECTOR);

    const btn = page.locator(BUTTON_SELECTOR);
    await expect(btn).toBeVisible();
    await btn.click();

    const clicked = await page.evaluate(() => {
      return (window as any).__p02Clicked === true;
    });

    await expect(clicked).toBe(true);
  });

  test(`Check Button Interactivity`, async ({ page }) => {
    await page.goto(BASE_URL);
    const btn = page.locator(BUTTON_SELECTOR);
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await btn.click();
    await expect(btn).toBeFocused();
  });

  test(`Check Button Visibility with Dependencies`, async ({ page }) => {
    await page.goto(BASE_URL);
    const btn = page.locator(BUTTON_SELECTOR);
    await expect(btn).toBeVisible();
    await expect(btn).toHaveCount(1);
  });

  test(`Check Button Visibility without Conditional Rendering`, async ({ page }) => {
    await page.goto(BASE_URL);
    const btn = page.locator(BUTTON_SELECTOR);
    await expect(btn).toBeVisible();

    const hidden = await btn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style && (style.display === "none" || style.visibility === "hidden");
    });

    await expect(hidden).toBe(false);
  });
});
