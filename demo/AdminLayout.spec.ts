import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("AdminLayout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("P0_1 - Logout Button Test", async ({ page }) => {
    const logoutSelector = "[data-testid='logout-button']";
    const logoutButton = page.locator(logoutSelector);

    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toBeEnabled();

    const initialURL = page.url();
    await logoutButton.click();
    await page.waitForLoadState("networkidle");
    const newURL = page.url();

    if (newURL === initialURL) {
      // If URL didn't change, expect the logout button to no longer be visible (common UX after logout)
      expect(await logoutButton.isVisible()).toBe(false);
    } else {
      // Otherwise expect that navigation occurred
      expect(newURL).not.toBe(initialURL);
    }
  });

  test("P1_2 - AdminLayout Responsive Test", async ({ page }) => {
    const sizes: Record<string, { width: number; height: number }> = {
      mobile: { width: 375, height: 812 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1280, height: 720 }
    };

    for (const key of Object.keys(sizes)) {
      const size = sizes[key];
      await page.setViewportSize(size);
      await page.goto(BASE_URL);
      await page.waitForLoadState("domcontentloaded");

      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(innerWidth).toBe(size.width);

      // Basic responsive sanity check: no horizontal overflow beyond viewport width
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(fits).toBeTruthy();
    }
  });

  test("P2_3 - AdminLayout Navigation Test", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/admin");
    await expect(page.locator("body")).toBeVisible();
  });
});
