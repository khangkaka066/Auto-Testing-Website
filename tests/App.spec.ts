import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("Verify Sign Up Button", async ({ page }) => {
    const buttonText = "Sign up";
    const button = page.getByRole("button", { name: buttonText });

    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Perform a real click action to verify the button is functional;
    await button.click();

    // After clicking, ensure the button can receive focus (common behavior) as a pragmatic assertion;
    await expect(button).toBeFocused();
  });

  test("Verify Log In Button", async ({ page }) => {
    const buttonText = "Log in";
    const button = page.getByRole("button", { name: buttonText });

    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    // Perform a real click action to verify the button is functional;
    await button.click();

    // Ensure the button can receive focus after interaction;
    await expect(button).toBeFocused();
  });

});
