import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test.describe("Navbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(/http:\/\/localhost:5173/);
  });

  test(`P0_1 - Navigation Link`, async ({ page }) => {
    const navLink = page.locator("a[href=\"/home\"], a:has-text(\"Home\")");
    await expect(navLink.first()).toBeVisible();
    await expect(navLink.first()).toBeEnabled();
    await navLink.first().click();
    await expect(page).toHaveURL(/\/home/);
  });

  test(`P0_2 - Search Functionality`, async ({ page }) => {
    const searchInput = page.locator("input[type=\"search\"], input[aria-label=\"Search\"], input[name=\"search\"], input[name=\"q\"], input[placeholder*=\"Search\"]");
    await expect(searchInput.first()).toBeVisible();
    await expect(searchInput.first()).toBeEnabled();
    await searchInput.first().fill("example query");
    await expect(searchInput.first()).toHaveValue("example query");

    const submitBtn = page.locator("button[type=\"submit\"], button[aria-label=\"Search\"], button:has-text(\"Search\")");
    if (await submitBtn.count() > 0) {
      await expect(submitBtn.first()).toBeVisible();
      await expect(submitBtn.first()).toBeEnabled();
      await submitBtn.first().click();
    } else {
      await searchInput.first().press("Enter");
    }

    const results = page.locator("[data-testid=\"search-results\"], #search-results, .search-results, [role=\"list\"]");
    if (await results.count() > 0) {
      await expect(results.first()).toBeVisible();
    } else {
      await expect(page).toHaveURL(/search|q=|query|example%20query/);
    }
  });
});
