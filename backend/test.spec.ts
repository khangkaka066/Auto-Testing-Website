import { test, expect, type Page, type Locator } from "@playwright/test";

const BASE_URL: string = "http://localhost:5173";

test.describe("ChatBubble", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator("body")).toBeVisible();
  });

  test("TC_UI_CHAT_001 Open Chat Bubble and Send a Valid Message (Happy Path)", async ({ page }) => {
    const openButton = page.locator("button.btn.btn-primary.rounded-circle.d-flex.justify-content-center.align-items-center").first();
    await expect(openButton).toBeVisible();
    await openButton.click();

    const inputField = page.locator("form.p-2 > input.form-control.form-control-sm.mb-2").first();
    await inputField.fill("Hello there!");

    const sendButton = page.locator("form.p-2 > button.btn.btn-primary.btn-sm.w-100").first();
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    const messageEntry = page.locator(`text="Hello there!"`).first();
    await expect(messageEntry).toBeVisible();

    await expect(inputField).toHaveValue("");

    await expect(page.locator("[role='alert']")).toHaveCount(0);
  });

  test("TC_UI_CHAT_002 Attempt to Send Empty Message (Validation Path)", async ({ page }) => {
    const openButton = page.locator("button.btn.btn-primary.rounded-circle.d-flex.justify-content-center.align-items-center").first();
    await openButton.click();

    const inputField = page.locator("form.p-2 > input.form-control.form-control-sm.mb-2").first();
    await inputField.fill("");

    const sendButton = page.locator("form.p-2 > button.btn.btn-primary.btn-sm.w-100").first();
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    const validation = page.getByText(`Please enter a message`, { exact: true }).first();
    await expect(validation).toBeVisible();

    await expect(inputField).toHaveValue("");

    await expect(page.locator("[role='alert']")).toHaveCount(0);
  });

  test("TC_UI_CHAT_003 Simulate API Failure on Send (Graceful Error Handling)", async ({ page }) => {
    await page.route("**/chatApi.sendChatMessage", (route) => {
      route.abort();
    });

    const openButton = page.locator("button.btn.btn-primary.rounded-circle.d-flex.justify-content-center.align-items-center").first();
    await openButton.click();

    const inputField = page.locator("form.p-2 > input.form-control.form-control-sm.mb-2").first();
    await inputField.fill("This will fail");

    const sendButton = page.locator("form.p-2 > button.btn.btn-primary.btn-sm.w-100").first();
    await sendButton.click();

    const errorToast = page.locator("[role='alert']");
    await expect(errorToast).toBeVisible();

    await expect(inputField).toHaveValue("This will fail");

    const failedMessage = page.locator(`text="This will fail"`).first();
    await expect(failedMessage).toHaveCount(0);
  });
});
