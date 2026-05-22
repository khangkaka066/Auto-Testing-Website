import { test, expect } from "@playwright/test";

const BASE_URL = `http://localhost:5173`;

test.describe(`ProfilePage Component`, () => {
  test(`P001 - ProfileSidebar Presence and Visibility`, async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    const sidebar = page.locator('[data-testid="profile-sidebar"], [aria-label="profile-sidebar"], .profile-sidebar');
    await expect(sidebar.first()).toBeVisible();
  });

  test(`P002 - ProfileForm Presence and Visibility`, async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    const form = page.locator('[data-testid="profile-form"], form#profileForm, .profile-form');
    await expect(form.first()).toBeVisible();
    const submit = form.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit")');
    await expect(submit.first()).toBeVisible();
  });

  test(`P003 - Initial State of ProfileForm`, async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    const firstName = page.locator('input[name="firstName"], [data-testid="firstName"], input[placeholder*="First"]');
    const lastName = page.locator('input[name="lastName"], [data-testid="lastName"], input[placeholder*="Last"]');

    // Verify inputs are present
    await expect(firstName.first()).toBeVisible();
    await expect(lastName.first()).toBeVisible();

    // Verify they are empty initially
    await expect(firstName.first()).toHaveValue("");
    await expect(lastName.first()).toHaveValue("");
  });

  test(`P004 - Validation Messages for Required Fields`, async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    const firstName = page.locator('input[name="firstName"], [data-testid="firstName"], input[placeholder*="First"]');
    const lastName = page.locator('input[name="lastName"], [data-testid="lastName"], input[placeholder*="Last"]');
    const submit = page.locator('form [type="submit"], button[type="submit"], form button:has-text("Save"), form button:has-text("Submit")');

    // Ensure fields are empty to simulate submitting empty values
    await expect(firstName.first()).toHaveValue("");
    await expect(lastName.first()).toHaveValue("");

    // Submit the form
    await submit.first().click();

    // Check validity via DOM API as a pragmatic fallback for different implementations
    const firstNameValid = await firstName.first().evaluate((el: HTMLInputElement) => el.checkValidity());
    const lastNameValid = await lastName.first().evaluate((el: HTMLInputElement) => el.checkValidity());
    await expect(firstNameValid).toBe(false);
    await expect(lastNameValid).toBe(false);

    // Additionally check for common validation indicators: aria-invalid or role=alert or text containing "required"
    const firstAriaInvalid = await firstName.first().getAttribute("aria-invalid");
    const lastAriaInvalid = await lastName.first().getAttribute("aria-invalid");

    if (firstAriaInvalid !== null) {
      await expect(firstAriaInvalid).toBe("true");
    }

    if (lastAriaInvalid !== null) {
      await expect(lastAriaInvalid).toBe("true");
    }

    const alert = page.locator('[role="alert"], .error, [data-testid^="error"]');
    if (await alert.count() > 0) {
      await expect(alert.first()).toBeVisible();
    } else {
      // Fallback: look for visible text mentioning required
      const reqText = page.getByText(/required|required field|is required/i);
      if ((await reqText.count()) > 0) {
        await expect(reqText.first()).toBeVisible();
      }
    }
  });

  test(`P005 - Submit Valid Data in ProfileForm`, async ({ page }) => {
    await page.goto(`${BASE_URL}/profile`);
    const firstName = page.locator('input[name="firstName"], [data-testid="firstName"], input[placeholder*="First"]');
    const lastName = page.locator('input[name="lastName"], [data-testid="lastName"], input[placeholder*="Last"]');
    const submit = page.locator('form [type="submit"], button[type="submit"], form button:has-text("Save"), form button:has-text("Submit")');

    // Fill with valid data provided in the test plan
    await firstName.fill("John");
    await lastName.fill("Doe");

    // Basic assertions before submit
    await expect(firstName).toHaveValue("John");
    await expect(lastName).toHaveValue("Doe");

    // Submit the form
    await submit.first().click();

    // Validate that fields are now valid
    const firstNameValid = await firstName.first().evaluate((el: HTMLInputElement) => el.checkValidity());
    const lastNameValid = await lastName.first().evaluate((el: HTMLInputElement) => el.checkValidity());
    await expect(firstNameValid).toBe(true);
    await expect(lastNameValid).toBe(true);

    // Expect no visible validation alerts mentioning required
    const reqText = page.getByText(/required|is required|required field/i);
    await expect(reqText).toHaveCount(0);

    // Optionally expect a success indicator (toast, alert, redirect). Check common success patterns.
    const success = page.locator('[role="status"], [role="alert"][data-success], .toast-success, .alert-success');
    if (await success.count() > 0) {
      await expect(success.first()).toBeVisible();
    }
  });
});
