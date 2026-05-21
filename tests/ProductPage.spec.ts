import { test, expect } from '@playwright/test';

// Test case: Select Sort Criteria

test('Select Sort Criteria', async ({ page }) => {
  // Precondition: Open ProductPage.
  await page.goto("http://localhost:3000/product-page");

  // Step: Click on the sort select element
  await page.click('select.sort-criteria');

  // Step: Select 'Price Low to High'
  await page.selectOption('select.sort-criteria', 'Price Low to High');

  // Step: Select 'Price High to Low'
  await page.selectOption('select.sort-criteria', 'Price High to Low');

  // Assertions: Verify the selected sort criteria
  expect(await page.textContent('span.selected-sort')).toBe('Price High to Low');
});

// Test case: Add Product to Cart

test('Add Product to Cart', async ({ page }) => {
  // Precondition: Open ProductPage.
  await page.goto("http://localhost:3000/product-page");

  // Step: Click on the 'Add to Cart' button
  await page.click('button.add-to-cart');

  // Assertions: Verify the product count in the cart
  expect(await page.textContent('span.cart-count')).toBe('1');
});
