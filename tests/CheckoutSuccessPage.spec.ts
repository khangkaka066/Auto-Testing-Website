import { test, expect } from '@playwright/test';

test.describe('CheckoutSuccessPage', () => {
  const baseUrl = 'http://localhost:3000';

  test('UI Test: Validate Product List Link', async ({ page }) => {
    await page.goto(baseUrl + '/checkout-success');
    const productListLink = page.locator('text=Product List');
    expect(productListLink).toBeVisible();
    await productListLink.click();
  });

  test('UI Test: Validate Home Page Link', async ({ page }) => {
    await page.goto(baseUrl + '/checkout-success');
    const homePageLink = page.locator('text=Home');
    expect(homePageLink).toBeVisible();
    await homePageLink.click();
  });
});
