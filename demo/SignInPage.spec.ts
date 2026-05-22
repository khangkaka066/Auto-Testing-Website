import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("SignInPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/signin`);
  });

  test("Email Input Visibility", async ({ page }) => {
    const email = page.locator("input[name=\"email\"]");
    await expect(email).toBeVisible();
    await expect(email).toBeEnabled();
  });

  test("Password Input Visibility", async ({ page }) => {
    const password = page.locator("input[name=\"password\"]");
    await expect(password).toBeVisible();
    await expect(password).toBeEnabled();
  });

  test("Submit Button Visibility", async ({ page }) => {
    const submit = page.locator("button[type=\"submit\"]");
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();
  });

  test("Sign Up Link Visibility", async ({ page }) => {
    const signUpLink = page.locator("text=Sign Up");
    await expect(signUpLink).toBeVisible();
  });

  test("Submit Button Functionality", async ({ page }) => {
    const email = page.locator("input[name=\"email\"]");
    const password = page.locator("input[name=\"password\"]");
    const submit = page.locator("button[type=\"submit\"]");

    await email.fill("example@test.com");
    await password.fill("Password123");

    await Promise.all([page.waitForNavigation(), submit.click()]);

    await expect(page).not.toHaveURL(`${BASE_URL}/signin`);
  });

  test("Sign Up Link Functionality", async ({ page }) => {
    const signUpLink = page.locator("text=Sign Up");
    await Promise.all([page.waitForNavigation(), signUpLink.click()]);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/signup`));
  });

  test("Email Input Validation", async ({ page }) => {
    const email = page.locator("input[name=\"email\"]");

    // Focus and blur to trigger validation UI if present
    await email.focus();
    await page.locator("body").focus();

    const isValid = await email.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test("Password Input Validation", async ({ page }) => {
    const password = page.locator("input[name=\"password\"]");

    // Focus and blur to trigger validation UI if present
    await password.focus();
    await page.locator("body").focus();

    const isValid = await password.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test("Submit Button Disabled State", async ({ page }) => {
    const email = page.locator("input[name=\"email\"]");
    const password = page.locator("input[name=\"password\"]");
    const submit = page.locator("button[type=\"submit\"]");

    // Both empty
    await email.fill("");
    await password.fill("");
    await expect(submit).toBeDisabled();

    // Email filled, password empty
    await email.fill("example@test.com");
    await password.fill("");
    await expect(submit).toBeDisabled();

    // Email empty, password filled
    await email.fill("");
    await password.fill("Password123");
    await expect(submit).toBeDisabled();
  });

  test("Submit Button Enabled State", async ({ page }) => {
    const email = page.locator("input[name=\"email\"]");
    const password = page.locator("input[name=\"password\"]");
    const submit = page.locator("button[type=\"submit\"]");

    await email.fill("example@test.com");
    await password.fill("Password123");

    await expect(submit).toBeEnabled();
  });
});
