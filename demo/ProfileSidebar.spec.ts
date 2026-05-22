import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("ProfileSidebar - Logout flows", () => {
  test("Logout Button Visibility and Functionality Test", async ({ page }) => {
    // Navigate to the app where the ProfileSidebar is rendered
    await page.goto(BASE_URL);

    // Locators
    const sidebar = page.locator("[data-testid=\"profile-sidebar\"]");
    const logoutButton = page.getByRole("button", { name: "Logout" });

    // Preconditions: ProfileSidebar should be visible
    await expect(sidebar).toBeVisible();

    // Assert logout button is visible and enabled
    await expect(logoutButton).toBeVisible();
    await expect(logoutButton).toBeEnabled();

    // User action: Click on the logout button
    await logoutButton.click();

    // Functionality: clicking should trigger an outcome - commonly a confirmation modal
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
  });

  test("Logout Button Confirmation Modal Test", async ({ page }) => {
    await page.goto(BASE_URL);

    const sidebar = page.locator("[data-testid=\"profile-sidebar\"]");
    const logoutButton = page.getByRole("button", { name: "Logout" });

    await expect(sidebar).toBeVisible();
    await expect(logoutButton).toBeVisible();

    // Click logout to open confirmation modal
    await logoutButton.click();

    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();

    // Modal should contain a confirmation message and both options
    await expect(confirmDialog).toContainText(/logout/i);

    const yesButton = confirmDialog.getByRole("button", { name: "Yes" });
    const noButton = confirmDialog.getByRole("button", { name: "No" });

    await expect(yesButton).toBeVisible();
    await expect(yesButton).toBeEnabled();
    await expect(noButton).toBeVisible();
    await expect(noButton).toBeEnabled();
  });

  test("Successful Logout Test", async ({ page }) => {
    await page.goto(BASE_URL);

    const sidebar = page.locator("[data-testid=\"profile-sidebar\"]");
    const logoutButton = page.getByRole("button", { name: "Logout" });

    await expect(sidebar).toBeVisible();
    await expect(logoutButton).toBeVisible();

    // Open confirmation and confirm logout
    await logoutButton.click();
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();

    const yesButton = confirmDialog.getByRole("button", { name: "Yes" });
    await expect(yesButton).toBeVisible();
    await yesButton.click();

    // After confirming logout, the user should be logged out.
    // Validate common post-logout signals: redirect to login or removal/hiding of the profile sidebar
    // Check for a redirect to a login-like URL OR sidebar no longer visible
    await Promise.all([
      // allow navigation to complete if it happens
      page.waitForLoadState("networkidle").catch(() => undefined)
    ]);

    // Try URL-based assertion first
    const url = page.url();
    if (/login|sign/i.test(url)) {
      await expect(page).toHaveURL(/login|sign/i);
    } else {
      // Fallback: sidebar should be hidden or removed after logout
      await expect(sidebar).not.toBeVisible();
    }
  });

  test("Cancel Logout Test", async ({ page }) => {
    await page.goto(BASE_URL);

    const sidebar = page.locator("[data-testid=\"profile-sidebar\"]");
    const logoutButton = page.getByRole("button", { name: "Logout" });

    await expect(sidebar).toBeVisible();
    await expect(logoutButton).toBeVisible();

    // Open confirmation and cancel logout
    await logoutButton.click();
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();

    const noButton = confirmDialog.getByRole("button", { name: "No" });
    await expect(noButton).toBeVisible();
    await noButton.click();

    // After cancelling, the confirmation modal should be dismissed and sidebar should remain
    await expect(confirmDialog).not.toBeVisible();
    await expect(sidebar).toBeVisible();
  });
});
