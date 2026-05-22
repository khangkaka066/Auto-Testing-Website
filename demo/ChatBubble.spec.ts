import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const TOGGLE_SELECTOR = ".btn.btn-sm.btn-outline-secondary";
const INPUT_SELECTOR = ".form-control.form-control-sm.mb-2";
const SUBMIT_SELECTOR = ".btn.btn-primary.btn-sm.w-100";

test.describe(`ChatBubble`, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test(`TC001 - Check if Chat Bubble can be toggled via button click`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_SELECTOR);
    await expect(toggle).toBeVisible();

    // Click to open the chat bubble and verify the input becomes visible
    await toggle.click();
    const input = page.locator(INPUT_SELECTOR);
    await expect(input).toBeVisible();

    // Click again to close the chat bubble and verify the input is hidden
    await toggle.click();
    await expect(input).toBeHidden();
  });

  test(`TC002 - Check if user can enter a message in the input field and submit it using the button`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_SELECTOR);
    await expect(toggle).toBeVisible();
    await toggle.click();

    const input = page.locator(INPUT_SELECTOR);
    await expect(input).toBeVisible();

    const message = "Hello from Playwright";
    await input.fill(message);
    await expect(input).toHaveValue(message);

    const submit = page.locator(SUBMIT_SELECTOR);
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();

    await submit.click();

    // Pragmatic assertion: after submit the input should be cleared or hidden
    // Prefer cleared value if component keeps open, otherwise it may hide the input (tested in other cases)
    await expect(input).toHaveValue("");
  });

  test(`TC003 - Check if user can submit a message using the button`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_SELECTOR);
    await toggle.click();

    const input = page.locator(INPUT_SELECTOR);
    await expect(input).toBeVisible();

    const submit = page.locator(SUBMIT_SELECTOR);
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();

    const message = "Submit button test message";
    await input.fill(message);
    await expect(input).toHaveValue(message);

    await submit.click();

    // After clicking submit, verify the input was cleared
    await expect(input).toHaveValue("");
  });

  test(`TC004 - Check if Chat Bubble closes after submitting a message`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_SELECTOR);
    await toggle.click();

    const input = page.locator(INPUT_SELECTOR);
    await expect(input).toBeVisible();

    await input.fill("Message that triggers close");
    const submit = page.locator(SUBMIT_SELECTOR);
    await expect(submit).toBeEnabled();

    await submit.click();

    // Verify the chat bubble (input) is no longer visible after submit
    await expect(input).toBeHidden();
  });

  test(`TC005 - Check if Chat Bubble reopens after toggling it back on`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_SELECTOR);
    await expect(toggle).toBeVisible();

    // Open first
    await toggle.click();
    const input = page.locator(INPUT_SELECTOR);
    await expect(input).toBeVisible();

    // Close
    await toggle.click();
    await expect(input).toBeHidden();

    // Reopen and verify visible again
    await toggle.click();
    await expect(input).toBeVisible();
  });

  test(`TC006 - Check if Chat Bubble displays an error message when the input field is empty and submit button is clicked`, async ({ page }) => {
    const toggle = page.locator(TOGGLE_SELECTOR);
    await toggle.click();

    const input = page.locator(INPUT_SELECTOR);
    await expect(input).toBeVisible();

    // Ensure input is empty
    await input.fill("");

    const submit = page.locator(SUBMIT_SELECTOR);
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();

    await submit.click();

    // Try to detect a visible error: common patterns are role=alert or aria-invalid or invalid CSS classes
    const alert = page.locator("[role=\"alert\"]");
    if (await alert.count() > 0) {
      await expect(alert.first()).toBeVisible();
    } else {
      // Fallback checks: aria-invalid attribute or an "invalid" class on the input
      const ariaInvalid = await input.getAttribute("aria-invalid");
      if (ariaInvalid === "true") {
        await expect(ariaInvalid).toBe("true");
      } else {
        const classAttr = (await input.getAttribute("class")) || "";
        // Expect the class attribute to contain common invalid markers
        const hasInvalidClass = classAttr.includes("is-invalid") || classAttr.includes("invalid") || classAttr.includes("error");
        await expect(hasInvalidClass).toBeTruthy();
      }
    }
  });
});
