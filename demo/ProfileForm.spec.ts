import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("ProfileForm", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test("ProfileForm - Full Name Input Field", async ({ page }) => {
    const fullNameInput = page.getByLabel("Full Name");

    await expect(fullNameInput).toBeVisible();
    await expect(fullNameInput).toBeEnabled();

    await fullNameInput.fill("John Doe");
    await expect(fullNameInput).toHaveValue("John Doe");
  });

  test("ProfileForm - Email Input Field", async ({ page }) => {
    const emailInput = page.getByLabel("Email");

    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();

    await emailInput.fill("john.doe@example.com");
    await expect(emailInput).toHaveValue("john.doe@example.com");
  });

  test("ProfileForm - Phone Input Field", async ({ page }) => {
    const phoneInput = page.getByLabel("Phone");

    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toBeEnabled();

    await phoneInput.fill("123-456-7890");
    await expect(phoneInput).toHaveValue("123-456-7890");
  });

  test("ProfileForm - Bio Textarea Field", async ({ page }) => {
    const bioTextarea = page.getByLabel("Bio");

    await expect(bioTextarea).toBeVisible();
    await expect(bioTextarea).toBeEnabled();

    await bioTextarea.fill("This is a bio text.");
    await expect(bioTextarea).toHaveValue("This is a bio text.");
  });

  test("ProfileForm - Save Changes Button", async ({ page }) => {
    const fullNameInput = page.getByLabel("Full Name");
    const emailInput = page.getByLabel("Email");
    const phoneInput = page.getByLabel("Phone");
    const bioTextarea = page.getByLabel("Bio");
    const saveButton = page.getByRole("button", { name: "Save Changes" });

    // Verify inputs and button are present
    await expect(fullNameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(bioTextarea).toBeVisible();
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    // Fill form with provided test data
    await fullNameInput.fill("John Doe");
    await emailInput.fill("john.doe@example.com");
    await phoneInput.fill("123-456-7890");
    await bioTextarea.fill("This is a bio text.");

    await expect(fullNameInput).toHaveValue("John Doe");
    await expect(emailInput).toHaveValue("john.doe@example.com");
    await expect(phoneInput).toHaveValue("123-456-7890");
    await expect(bioTextarea).toHaveValue("This is a bio text.");

    // Attempt to save
    await saveButton.click();

    // Basic post-click assertions: button still visible and enabled (no navigation expected in component test)
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();
  });
});
