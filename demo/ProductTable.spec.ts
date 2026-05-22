import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe(`ProductTable`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Ensure the page loaded; waiting for either edit or delete button to appear is a pragmatic way
    // to infer that the ProductTable component is present on the page.
    await page.waitForTimeout(250);
  });

  test(`TC001 - Test Edit Product Button Functionality`, async ({ page }) => {
    const editSelector = ".btn.btn-sm.btn-outline-primary";
    const editBtn = page.locator(editSelector).first();

    // Assert the button is present, visible and enabled
    await expect(editBtn).toBeVisible();
    await expect(editBtn).toBeEnabled();

    // Perform a real click to verify it is clickable without throwing
    await editBtn.click();

    // After click, at minimum the click should succeed without navigation errors;
    // short pause to allow any UI reaction to occur.
    await page.waitForTimeout(300);
  });

  test(`TC002 - Test Delete Product Button Functionality`, async ({ page }) => {
    const deleteSelector = ".btn.btn-sm.btn-outline-danger";
    const deleteBtn = page.locator(deleteSelector).first();

    // Assert the button is present, visible and enabled
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toBeEnabled();

    // Click to verify it is interactable
    await deleteBtn.click();

    // Allow UI to react if needed
    await page.waitForTimeout(300);
  });

  test(`TC003 - Test Edit Product Modal Opening`, async ({ page }) => {
    const editSelector = ".btn.btn-sm.btn-outline-primary";
    const editBtn = page.locator(editSelector).first();

    await expect(editBtn).toBeVisible();
    await expect(editBtn).toBeEnabled();

    // Click the edit button to open the edit modal
    await editBtn.click();

    // Common modal containers often use a .modal class or role="dialog"; check both.
    const modalByClass = page.locator(".modal").first();
    const dialogByRole = page.getByRole("dialog").first();

    // Wait for either a modal element or a dialog role to appear visible
    const modalVisible = await Promise.race([
      modalByClass.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false),
      dialogByRole.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false)
    ]);

    // Assert that some form of modal/dialog became visible
    if (modalVisible) {
      // Preferentially assert on the found modal element
      if (await modalByClass.isVisible()) {
        await expect(modalByClass).toBeVisible();
        // Heuristic: edit modals typically contain the word Edit or Edit product
        await expect(modalByClass).toContainText(/Edit/i);
      } else {
        await expect(dialogByRole).toBeVisible();
        await expect(dialogByRole).toContainText(/Edit/i);
      }
    } else {
      // If no modal appeared within timeout, fail the test with a descriptive message
      throw new Error("Edit modal did not appear after clicking the Edit product button.");
    }
  });

  test(`TC004 - Test Delete Product Confirmation Modal Opening`, async ({ page }) => {
    const deleteSelector = ".btn.btn-sm.btn-outline-danger";
    const deleteBtn = page.locator(deleteSelector).first();

    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toBeEnabled();

    // Click the delete button to open the confirmation modal
    await deleteBtn.click();

    // Check for modal/dialog presence
    const modalByClass = page.locator(".modal").first();
    const dialogByRole = page.getByRole("dialog").first();

    const modalVisible = await Promise.race([
      modalByClass.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false),
      dialogByRole.waitFor({ state: "visible", timeout: 2000 }).then(() => true).catch(() => false)
    ]);

    if (modalVisible) {
      if (await modalByClass.isVisible()) {
        await expect(modalByClass).toBeVisible();
        // Heuristic: confirmation modals often contain Delete or Are you sure
        await expect(modalByClass).toContainText(/Delete|Are you sure/i);
      } else {
        await expect(dialogByRole).toBeVisible();
        await expect(dialogByRole).toContainText(/Delete|Are you sure/i);
      }
    } else {
      throw new Error("Delete confirmation modal did not appear after clicking the Delete product button.");
    }
  });
});
