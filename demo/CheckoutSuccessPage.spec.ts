import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe(`CheckoutSuccessPage - UI`, () => {
  test(`P0_01 - UI Test: Validate Product List Link`, async ({ page }) => {
    const pageUrl = `${BASE_URL}/checkout-success`;
    await page.goto(pageUrl);
    await expect(page).toHaveURL(pageUrl);

    const expectedText = `Product List`;
    const productListLink = page.getByRole("link", { name: expectedText });

    // Assert the link is visible and enabled
    await expect(productListLink).toBeVisible();
    await expect(productListLink).toBeEnabled();

    // Capture current URL, click and verify navigation occurred
    const beforeClick = page.url();
    await productListLink.click();

    // Expect navigation to a different URL after clicking the link
    await expect(page).not.toHaveURL(beforeClick);
  });

  test(`P0_02 - UI Test: Validate Home Page Link`, async ({ page }) => {
    const pageUrl = `${BASE_URL}/checkout-success`;
    await page.goto(pageUrl);
    await expect(page).toHaveURL(pageUrl);

    const expectedText = `Home`;
    const homeLink = page.getByRole("link", { name: expectedText });

    // Assert the link is visible and enabled
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toBeEnabled();

    // Capture current URL, click and verify navigation occurred
    const beforeClick = page.url();
    await homeLink.click();

    // Expect navigation to a different URL after clicking the link
    await expect(page).not.toHaveURL(beforeClick);
  });
});
