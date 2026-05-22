import { test, expect } from "@playwright/test";

const BASE_URL = `http://localhost:5173`;

test.describe(`Navbar`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}`));
  });

  test(`Navigation Link`, async ({ page }) => {
    // Test data
    const linkHref = `/home`;

    // Locate the navigation link (scoped to nav if present, fallback to any anchor)
    const navLink = page.locator(`nav a[href="${linkHref}"], a[href="${linkHref}"]`);

    // Assertions before action
    await expect(navLink).toBeVisible();
    await expect(navLink).toBeEnabled();
    await expect(navLink).toHaveAttribute("href", linkHref);

    // Click and wait for navigation
    await Promise.all([page.waitForNavigation(), navLink.click()]);

    // Verify the resulting URL is correct
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}${linkHref}`));
  });

  test(`Search Functionality`, async ({ page }) => {
    // Test data
    const query = `example query`;

    // Locate a search input using several common patterns
    const searchInput = page.locator(
      `nav input[type="search"], nav input[name="search"], nav input[aria-label="Search"], nav input[placeholder="Search"], input[type="search"], input[name="search"]`
    );

    // Ensure the input exists and is visible
    await expect(searchInput.first()).toBeVisible();
    await expect(searchInput.first()).toBeEnabled();

    // Type the query and assert the value
    await searchInput.first().fill(query);
    await expect(searchInput.first()).toHaveValue(query);

    // Locate a submit button for the search
    const submitButton = page.locator(
      `nav button[type="submit"], nav button[aria-label="Search"], nav button:has-text("Search"), button[type="submit"]`
    );

    await expect(submitButton.first()).toBeVisible();
    await expect(submitButton.first()).toBeEnabled();

    // Click the submit button and wait for potential load/network activity
    await submitButton.first().click();
    await page.waitForLoadState("networkidle");

    // Basic verification: the URL should contain the encoded query (common behavior for search)
    const encoded = encodeURIComponent(query);
    expect(page.url()).toContain(encoded);
  });
});
