import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe(`CartPage`, () => {
  test(`TC_UI_01 - CartPage Navigation Link Test`, async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const link = page.locator(`.btn.btn-primary.px-4.py-2.fw-bold`).first();
    await expect(link).toBeVisible();
    await expect(link).toBeEnabled();
    await Promise.all([page.waitForURL("**/products"), link.click()]);
    await expect(page).toHaveURL(/\/products/);
  });

  test(`TC_UI_02 - CartPage Decrease Product Quantity Test`, async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const buttonSelector = `.btn.btn-sm.btn-outline-secondary.px-2[onClick*=\'handleDecrease\']`;
    const btn = page.locator(buttonSelector).first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();

    const readQtyFromButton = async (button) => {
      const parentHandle = await button.locator("xpath=ancestor::div[1]").elementHandle();
      if (!parentHandle) {
        return null;
      }
      const qty = await parentHandle.evaluate((el) => {
        const input = el.querySelector("input[type=\"number\"], input[type=\"text\"]");
        if (input) {
          const v = parseInt((input as HTMLInputElement).value || "", 10);
          return Number.isFinite(v) ? v : null;
        }
        const text = el.innerText || "";
        const m = text.match(/\d+/);
        return m ? parseInt(m[0], 10) : null;
      });
      return qty;
    };

    const before = await readQtyFromButton(btn);
    await expect(before).not.toBeNull();
    await btn.click();
    // Give UI a moment to update
    await page.waitForTimeout(250);
    const after = await readQtyFromButton(btn);
    await expect(after).not.toBeNull();
    await expect(after).toBe(before - 1);
  });

  test(`TC_UI_03 - CartPage Increase Product Quantity Test`, async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const buttonSelector = `.btn.btn-sm.btn-outline-secondary.px-2[onClick*=\'handleIncrease\']`;
    const btn = page.locator(buttonSelector).first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();

    const readQtyFromButton = async (button) => {
      const parentHandle = await button.locator("xpath=ancestor::div[1]").elementHandle();
      if (!parentHandle) {
        return null;
      }
      const qty = await parentHandle.evaluate((el) => {
        const input = el.querySelector("input[type=\"number\"], input[type=\"text\"]");
        if (input) {
          const v = parseInt((input as HTMLInputElement).value || "", 10);
          return Number.isFinite(v) ? v : null;
        }
        const text = el.innerText || "";
        const m = text.match(/\d+/);
        return m ? parseInt(m[0], 10) : null;
      });
      return qty;
    };

    const before = await readQtyFromButton(btn);
    await expect(before).not.toBeNull();
    await btn.click();
    // Allow UI update
    await page.waitForTimeout(250);
    const after = await readQtyFromButton(btn);
    await expect(after).not.toBeNull();
    await expect(after).toBe(before + 1);
  });

  test(`TC_UI_04 - CartPage Remove Product Test`, async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const buttonSelector = `.btn.btn-sm.btn-outline-danger[onClick*=\'handleRemove\']`;
    const buttons = page.locator(buttonSelector);
    const beforeCount = await buttons.count();
    await expect(beforeCount).toBeGreaterThan(0);
    await buttons.first().click();
    // allow removal animation / DOM update
    await page.waitForTimeout(300);
    const afterCount = await page.locator(buttonSelector).count();
    await expect(afterCount).toBe(beforeCount - 1);
  });

  test(`TC_UI_05 - CartPage Checkout Button Test`, async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    const checkoutButton = page.locator(`.btn.btn-primary.btn-lg.w-100.fw-bold.py-3.shadow-sm`).first();
    await expect(checkoutButton).toBeVisible();
    await expect(checkoutButton).toBeEnabled();
    await Promise.all([page.waitForURL("**/checkout"), checkoutButton.click()]);
    await expect(page).toHaveURL(/\/checkout/);
  });
});
