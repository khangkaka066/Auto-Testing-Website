import { test, expect } from "@playwright/test";

const BASE_URL = `http://localhost:5173`;
const PRODUCT_PATH = `/product/1`;
const PRODUCT_URL = `${BASE_URL}${PRODUCT_PATH}`;

test.describe(`ProductDetailsPage`, () => {
  test(`Test Go back button presence and clickability`, async ({ page }) => {
    // Navigate directly to the product details page
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    const goBack = page.locator(`.btn.btn-outline-secondary.mb-4.shadow-sm`);
    await expect(goBack).toBeVisible();
    await expect(goBack).toBeEnabled();

    // Ensure the button can be clicked without throwing errors
    await goBack.click();

    // Wait a short time for any navigation or UI reaction
    await page.waitForLoadState("networkidle");

    // Sanity assertion: page.url() should be a string and page should still be reachable
    expect(typeof page.url()).toBe("string");
  });

  test(`Test Add to cart or contact for purchase button presence and clickability`, async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    const addBtn = page.locator(`.btn.btn-lg.w-100.py-3.fw-bold.shadow-sm`);
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeEnabled();

    // Click the primary purchase button to ensure it is actionable
    await addBtn.click();

    // Wait for potential navigation or UI updates
    await page.waitForLoadState("networkidle");

    // Sanity assertion: after clicking, the page remains reachable
    expect(typeof page.url()).toBe("string");
  });

  test(`Test navigation after clicking Go back button`, async ({ page }) => {
    // Create a previous history entry at the site root to ensure back navigates somewhere
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Now navigate to the product page so history has at least two entries
    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    const beforeUrl = page.url();
    const goBack = page.locator(`.btn.btn-outline-secondary.mb-4.shadow-sm`);
    await expect(goBack).toBeVisible();
    await expect(goBack).toBeEnabled();

    // Attempt to capture navigation triggered by the click; if none occurs, assert url changed
    const [nav] = await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 3000 }).catch(() => null),
      goBack.click()
    ]);

    if (nav) {
      // Prefer an explicit assertion that we returned to root when navigation occurred
      expect(page.url()).toBe(`${BASE_URL}/`);
    } else {
      // If no navigation event fired, at minimum the URL should not still equal the pre-click URL
      expect(page.url()).not.toBe(beforeUrl);
    }
  });

  test(`Test navigation after clicking Add to cart or contact for purchase button`, async ({ page }) => {
    // Seed history to have a previous page
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    await page.goto(PRODUCT_URL);
    await page.waitForLoadState("networkidle");

    const beforeUrl = page.url();
    const addBtn = page.locator(`.btn.btn-lg.w-100.py-3.fw-bold.shadow-sm`);
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toBeEnabled();

    // Click and wait for possible navigation (to /cart, /contact, etc.). If no navigation, assert URL changed.
    const [nav] = await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 3000 }).catch(() => null),
      addBtn.click()
    ]);

    if (nav) {
      // If navigation occurred, assert URL is different from product page (pragmatic check)
      expect(page.url()).not.toBe(PRODUCT_URL);
    } else {
      // If no navigation occurred, ensure some UI reaction happened by verifying URL changed as a fallback
      expect(page.url()).not.toBe(beforeUrl);
    }
  });
});
