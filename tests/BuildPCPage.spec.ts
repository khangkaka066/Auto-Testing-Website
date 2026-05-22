import { test, expect } from "@playwright/test";

test.describe("BuildPCPage - component tests", () => {
  const baseUrl = `http://localhost:5173`;

  test.beforeEach(async ({ page }) => {
    // Navigate to the BuildPCPage. Adjust path if your app uses a different route.
    await page.goto(`${baseUrl}/build`);
  });

  test("TC_001 - Validate Modal Open Functionality", async ({ page }) => {
    const modalSelector = ".modal";
    const openModalButton = page.getByRole("button", { name: "Open modal for selecting products by category" });
    await expect(openModalButton).toBeVisible();
    await openModalButton.click();
    const modal = page.locator(modalSelector);
    await expect(modal).toBeVisible();
  });

  test("TC_002 - Validate Item Removal Functionality", async ({ page }) => {
    const itemSelector = ".selected-item";
    const countBefore = await page.locator(itemSelector).count();
    test.skip(countBefore === 0, "Precondition: The user should have at least one item in the build.");

    await expect(page.locator(itemSelector)).toHaveCount(countBefore);
    const removeButton = page.getByRole("button", { name: "Remove a selected item from the build" });
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    const expectedCount = Math.max(0, countBefore - 1);
    await expect(page.locator(itemSelector)).toHaveCount(expectedCount);
  });

  test("TC_003 - Validate Clear All Functionality", async ({ page }) => {
    const itemSelector = ".selected-item";
    const countBefore = await page.locator(itemSelector).count();
    test.skip(countBefore === 0, "Precondition: The user should have at least one item selected.");

    const clearAllButton = page.getByRole("button", { name: "Clear all selected items" });
    await expect(clearAllButton).toBeVisible();
    await clearAllButton.click();

    await expect(page.locator(itemSelector)).toHaveCount(0);
  });

  test("TC_004 - Validate Add All to Cart Functionality", async ({ page }) => {
    const itemSelector = ".selected-item";
    const countBefore = await page.locator(itemSelector).count();
    test.skip(countBefore === 0, "Precondition: The user should have at least one item selected.");

    const addAllButton = page.getByRole("button", { name: "Add all selected items to the cart" });
    await expect(addAllButton).toBeVisible();
    await addAllButton.click();

    // Pragmatic assertion: after adding all to cart we expect no selected items remain in the build.
    await expect(page.locator(itemSelector)).toHaveCount(0);
  });

  test("TC_005 - Validate Disabled Clear All Button", async ({ page }) => {
    const itemSelector = ".selected-item";
    const countBefore = await page.locator(itemSelector).count();
    test.skip(countBefore !== 0, "Precondition: The user should not have any items selected.");

    const clearAllButton = page.getByRole("button", { name: "Clear all selected items" });
    await expect(clearAllButton).toBeVisible();
    await expect(clearAllButton).toBeDisabled();
  });

  test("TC_006 - Validate Disabled Add All Button", async ({ page }) => {
    const itemSelector = ".selected-item";
    const countBefore = await page.locator(itemSelector).count();
    test.skip(countBefore !== 0, "Precondition: The user should not have any items selected.");

    const addAllButton = page.getByRole("button", { name: "Add all selected items to the cart" });
    await expect(addAllButton).toBeVisible();
    await expect(addAllButton).toBeDisabled();
  });

});
