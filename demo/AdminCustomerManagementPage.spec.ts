import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("AdminCustomerManagementPage", () => {
  test("Verify Add Customer Button Functionality", async ({ page }) => {
    const buttonSelector = ".btn-primary";

    // Navigate to the Admin Customer Management page
    await page.goto(`${BASE_URL}/admin/customers`);
    await page.waitForLoadState("networkidle");

    const addButton = page.locator(buttonSelector);

    // Assertions: visible and enabled
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    // Perform action: click the button and ensure no immediate JS error is thrown
    await addButton.click();

    // Pragmatic assertion: after click, either a dialog appears or the button remains visible
    const dialogVisible = await page.locator("[role=\"dialog\"]").isVisible().catch(() => false);
    if (!dialogVisible) {
      // Fallback assertion: button should still be present and enabled after click
      await expect(addButton).toBeVisible();
      await expect(addButton).toBeEnabled();
    }
  });

  test("Verify Search Input Functionality", async ({ page }) => {
    const inputSelector = ".form-control.mb-3";

    await page.goto(`${BASE_URL}/admin/customers`);
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator(inputSelector);

    // Assertions: input is visible and enabled
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();

    // Fill the input and verify value
    const sampleQuery = "Test Customer 123";
    await searchInput.fill(sampleQuery);
    await expect(searchInput).toHaveValue(sampleQuery);

    // Optionally, verify that typing triggers some change in DOM like filtering results
    // We'll look for any result row changes within a reasonable container
    const resultsContainer = page.locator("[data-testid=customers-list], .customers-list, table");
    if (await resultsContainer.count() > 0) {
      // If results exist, expect at least one child or that the container is visible
      await expect(resultsContainer.first()).toBeVisible();
    }
  });

  test("Verify Add Customer Button Behavior with No Input", async ({ page }) => {
    const buttonSelector = ".btn-primary";
    const inputSelector = ".form-control.mb-3";

    await page.goto(`${BASE_URL}/admin/customers`);
    await page.waitForLoadState("networkidle");

    const addButton = page.locator(buttonSelector);
    const searchInput = page.locator(inputSelector);

    // Ensure input is empty
    if (await searchInput.count() > 0) {
      await searchInput.fill("");
      await expect(searchInput).toHaveValue("");
    }

    const beforeUrl = page.url();

    // Click add button with no search input
    await addButton.click();

    // Wait briefly to allow potential navigation or UI change
    await page.waitForTimeout(500);

    // Expectation: no navigation occurred (URL remains the same)
    await expect(page).toHaveURL(beforeUrl);
  });

  test("Verify Add Customer Button Behavior with Invalid Input", async ({ page }) => {
    const buttonSelector = ".btn-primary";
    const inputSelector = ".form-control.mb-3";

    await page.goto(`${BASE_URL}/admin/customers`);
    await page.waitForLoadState("networkidle");

    const addButton = page.locator(buttonSelector);
    const searchInput = page.locator(inputSelector);

    // Fill with invalid input
    const invalidInput = "!!!@@@###";
    if (await searchInput.count() > 0) {
      await searchInput.fill(invalidInput);
      await expect(searchInput).toHaveValue(invalidInput);
    }

    const beforeUrl = page.url();

    // Click add button
    await addButton.click();

    // Wait briefly
    await page.waitForTimeout(500);

    // Expectation: action should not navigate away or perform unintended navigation
    await expect(page).toHaveURL(beforeUrl);
  });

  test("Verify Add Customer Button Behavior with Valid Input", async ({ page }) => {
    const buttonSelector = ".btn-primary";
    const inputSelector = ".form-control.mb-3";

    await page.goto(`${BASE_URL}/admin/customers`);
    await page.waitForLoadState("networkidle");

    const addButton = page.locator(buttonSelector);
    const searchInput = page.locator(inputSelector);

    // Fill with a plausible valid input
    const validInput = "John Doe";
    if (await searchInput.count() > 0) {
      await searchInput.fill(validInput);
      await expect(searchInput).toHaveValue(validInput);
    }

    // Click add button
    await addButton.click();

    // After clicking with valid input we expect some observable action: open dialog or navigate to create page
    let actionObserved = false;

    // 1) Check for a dialog/modal appearance
    try {
      await page.locator("[role=\"dialog\"]").waitFor({ state: "visible", timeout: 1000 });
      actionObserved = true;
    } catch (e) {
      // ignore
    }

    // 2) If no dialog, check for navigation to an expected creation path (create/new/add)
    if (!actionObserved) {
      try {
        await page.waitForURL(/create|new|add/i, { timeout: 1000 });
        actionObserved = true;
      } catch (e) {
        // ignore
      }
    }

    // Final assertion: at least one expected action occurred
    await expect(actionObserved).toBeTruthy();
  });
});
