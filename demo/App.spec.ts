import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe(`App`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test(`1001 - Verify Sign Up Button`, async ({ page }) => {
    const buttonText = `Sign up`;
    const button = page.getByRole("button", { name: buttonText });

    // Verify visible and enabled
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Perform the user action
    await button.click();

    // Wait briefly for potential navigation or UI updates
    await page.waitForLoadState("networkidle");

    // Pragmatic assertion: page remains reachable and served from base origin
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}`));
  });

  test(`1002 - Verify Log In Button`, async ({ page }) => {
    const buttonText = `Log in`;
    const button = page.getByRole("button", { name: buttonText });

    // Verify visible and enabled
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Perform the user action
    await button.click();

    // Wait briefly for potential navigation or UI updates
    await page.waitForLoadState("networkidle");

    // Pragmatic assertion: page remains reachable and served from base origin
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}`));
  });
});
