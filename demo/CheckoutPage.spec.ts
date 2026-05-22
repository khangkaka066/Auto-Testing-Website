import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("CheckoutPage", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the checkout page before each test
    await page.goto(`${BASE_URL}/checkout`);
  });

  test("UI-01 - Render UI Components", async ({ page }) => {
    // Verify main heading is visible
    const heading = page.getByRole("heading", { name: /checkout/i });
    await expect(heading).toBeVisible();

    // Verify form fields are present and enabled
    const nameInput = page.locator("input[name=\"name\"]");
    const phoneInput = page.locator("input[name=\"phone\"]");
    const addressInput = page.locator("textarea[name=\"address\"]");
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toBeEnabled();
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toBeEnabled();
    await expect(addressInput).toBeVisible();
    await expect(addressInput).toBeEnabled();

    // Verify presence of primary action (pay) and cart/summary region
    const payButton = page.getByRole("button", { name: /pay/i });
    await expect(payButton).toBeVisible();
    await expect(payButton).toBeEnabled();

    // Check for a cart summary or order summary section
    const summary = page.getByRole("region", { name: /summary|order summary|cart summary/i });
    const summaryExists = await summary.count();
    if (summaryExists > 0) {
      await expect(summary).toBeVisible();
    } else {
      // fallback: look for common text that indicates a summary
      const summaryText = page.locator("text=Total");
      await expect(summaryText).toBeVisible();
    }
  });

  test("UI-02 - Check for Errors During Rendering", async ({ page }) => {
    // Capture console error messages during page load
    const errors: string[] = [];
    page.on("console", msg => {
      try {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      } catch (e) {
        // ignore instrumentation errors
      }
    });

    // Reload to capture any rendering-time issues
    await page.reload();

    // Small wait to allow any console messages to appear
    await page.waitForTimeout(500);

    // Assert no console errors were emitted during rendering
    expect(errors.length).toBe(0);
  });

  test("UI-03 - Check Responsiveness", async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: "mobile" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 1280, height: 720, name: "desktop" }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.reload();

      // Key elements should remain visible across sizes
      const heading = page.getByRole("heading", { name: /checkout/i });
      await expect(heading).toBeVisible();

      const payButton = page.getByRole("button", { name: /pay/i });
      await expect(payButton).toBeVisible();

      const nameInput = page.locator("input[name=\"name\"]");
      await expect(nameInput).toBeVisible();

      // Ensure layout did not collapse completely: check that either a summary or total text is visible
      const total = page.locator("text=Total");
      const summary = page.getByRole("region", { name: /summary|order summary|cart summary/i });
      if ((await total.count()) === 0 && (await summary.count()) === 0) {
        // If neither selector matched, assert at least that pay button remains enabled
        await expect(payButton).toBeEnabled();
      } else {
        if ((await summary.count()) > 0) {
          await expect(summary).toBeVisible();
        } else {
          await expect(total).toBeVisible();
        }
      }
    }
  });

  test("UI-04 - Test Payment Initiation", async ({ page }) => {
    // Fill out the checkout form with provided test data
    const testData = {
      name: "John Doe",
      phone: "+1234567890",
      address: "123 Elm St, Anytown, USA"
    };

    const nameInput = page.locator("input[name=\"name\"]");
    const phoneInput = page.locator("input[name=\"phone\"]");
    const addressInput = page.locator("textarea[name=\"address\"]");
    const payButton = page.getByRole("button", { name: /pay/i });

    if ((await nameInput.count()) > 0) {
      await nameInput.fill(testData.name);
      await expect(nameInput).toHaveValue(testData.name);
    }

    if ((await phoneInput.count()) > 0) {
      await phoneInput.fill(testData.phone);
      await expect(phoneInput).toHaveValue(testData.phone);
    }

    if ((await addressInput.count()) > 0) {
      await addressInput.fill(testData.address);
      await expect(addressInput).toHaveValue(testData.address);
    }

    // Attempt to initiate payment and observe behavior
    await expect(payButton).toBeVisible();
    await expect(payButton).toBeEnabled();

    await payButton.click();

    // Possible expected outcomes after initiating payment:
    // 1) A success or confirmation message appears
    // 2) The page navigates to a confirmation route
    // 3) The pay button becomes disabled or shows processing

    const successMessages = [
      page.locator("text=Thank you for your order"),
      page.locator("text=Order confirmed"),
      page.locator("text=Payment successful")
    ];

    let sawSuccess = false;
    for (const locator of successMessages) {
      if ((await locator.count()) > 0) {
        try {
          await locator.waitFor({ timeout: 3000 });
          sawSuccess = true;
          break;
        } catch (e) {
          // continue checking other possibilities
        }
      }
    }

    if (!sawSuccess) {
      // If no explicit success message, check for navigation away from checkout or disabled button
      try {
        await expect(page).not.toHaveURL(`${BASE_URL}/checkout`, { timeout: 3000 });
        sawSuccess = true;
      } catch (e) {
        // not navigated; check button disabled state
        try {
          await expect(payButton).toBeDisabled({ timeout: 3000 });
          sawSuccess = true;
        } catch (inner) {
          // no clear signal; fail the test to indicate payment initiation did not produce an observable effect
          throw new Error("Payment initiation did not produce an observable confirmation, navigation, or processing state.");
        }
      }
    }

    // Final assertion that some outcome was observed
    expect(sawSuccess).toBe(true);
  });
});
