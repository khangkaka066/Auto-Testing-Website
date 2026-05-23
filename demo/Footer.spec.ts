import { test, expect } from "@playwright/test";

test.describe("Footer", () => {
  const BASE = "http://localhost:5173";
  const LINK_TEXT = "Privacy Policy";

  test("TC001 - Navigation Link Presence", async ({ page }) => {
    // Navigate to the app where the Footer is rendered
    await page.goto(BASE);

    // Locate the footer region and assert visibility
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Find the navigation link by accessible name and assert basic states
    const link = footer.getByRole("link", { name: LINK_TEXT });
    await expect(link).toBeVisible();
    await expect(link).toBeEnabled();

    // Assert the link has an href attribute and it is not empty
    const href = await link.getAttribute("href");
    await expect(href).not.toBeNull();
    await expect(href).not.toBe("");
  });

  test("TC002 - Navigation Link Clickability", async ({ page, context }) => {
    // Navigate to the app where the Footer is rendered
    await page.goto(BASE);

    // Locate the footer and the link
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    const link = footer.getByRole("link", { name: LINK_TEXT });
    await expect(link).toBeVisible();
    await expect(link).toBeEnabled();

    // Grab href and target to decide how to assert click behavior
    const href = await link.getAttribute("href");
    await expect(href).not.toBeNull();
    const target = await link.getAttribute("target");

    // Build an absolute expected URL when possible
    const expectedUrl = href ? new URL(href, BASE).toString() : null;

    if (target === "_blank") {
      // Clicking should open a new tab/window; capture it
      const [newPage] = await Promise.all([
        context.waitForEvent("page"),
        link.click()
      ]);
      await newPage.waitForLoadState("domcontentloaded");

      if (expectedUrl) {
        expect(newPage.url()).toContain(expectedUrl);
      } else {
        expect(newPage.url().length).toBeGreaterThan(0);
      }

      await newPage.close();
    } else {
      // Click and wait for navigation in the same tab
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        link.click()
      ]);

      if (expectedUrl) {
        expect(page.url()).toContain(expectedUrl);
      } else {
        expect(page.url().length).toBeGreaterThan(0);
      }
    }
  });
});
