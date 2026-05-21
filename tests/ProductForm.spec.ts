import { test, expect } from '@playwright/test';

// Display All Input Fields
// Verify that the form displays all input fields correctly.
test('Display All Input Fields', async ({ page }) => {
  await page.goto('http://localhost:3000/ProductForm');

  // TODO: Add assertions to check for presence and visibility of each input field
  // Example:
  // expect(await page.locator('#name-input').isVisible()).toBe(true);
});

// Submit Valid Data
// Verify that the form can be submitted with valid data.
test('Submit Valid Data', async ({ page }) => {
  await page.goto('http://localhost:3000/ProductForm');

  // Fill in all fields with valid data
  await page.fill('#name-input', 'Sample Product');
  await page.fill('#price-input', '19.99');
  await page.fill('#stock_quantity-input', '10');
  await page.fill('#category-input', 'Electronics');
  await page.fill('#brand-input', 'BrandX');
  await page.fill('#image_url-input', 'https://example.com/sample.jpg');
  await page.fill('#description-input', 'This is a sample product.');

  // Submit the form
  await Promise.all([
    page.waitForNavigation(),
    page.click('#submit-button')
  ]);

  // TODO: Add assertions to check for successful submission or redirection
  // Example:
  // expect(await page.url()).toContain('/success');
});

// Cancel Form Submission
// Verify that the form can be cancelled.
test('Cancel Form Submission', async ({ page }) => {
  await page.goto('http://localhost:3000/ProductForm');

  // Fill in all fields with valid data
  await page.fill('#name-input', 'Sample Product');
  await page.fill('#price-input', '19.99');
  await page.fill('#stock_quantity-input', '10');
  await page.fill('#category-input', 'Electronics');
  await page.fill('#brand-input', 'BrandX');
  await page.fill('#image_url-input', 'https://example.com/sample.jpg');
  await page.fill('#description-input', 'This is a sample product.');

  // Cancel the form submission
  await Promise.all([
    page.waitForNavigation(),
    page.click('#cancel-button')
  ]);

  // TODO: Add assertions to check for cancellation or redirection to a list page
  // Example:
  // expect(await page.url()).toContain('/products');
});

// Input Fields with Empty Values
// Verify that the form handles empty input fields.
test('Input Fields with Empty Values', async ({ page }) => {
  await page.goto('http://localhost:3000/ProductForm');

  // Fill in all fields with empty data
  await page.fill('#name-input', '');
  await page.fill('#price-input', '');
  await page.fill('#stock_quantity-input', '');
  await page.fill('#category-input', '');
  await page.fill('#brand-input', '');
  await page.fill('#image_url-input', '');
  await page.fill('#description-input', '');

  // Submit the form
  await Promise.all([
    page.waitForNavigation(),
    page.click('#submit-button')
  ]);

  // TODO: Add assertions to check for error messages or validation failures
  // Example:
  // expect(await page.locator('.error-message').isVisible()).toBe(true);
});

// Input Fields with Invalid Data
// Verify that the form handles invalid input types.
test('Input Fields with Invalid Data', async ({ page }) => {
  await page.goto('http://localhost:3000/ProductForm');

  // Fill in all fields with invalid data
  await page.fill('#name-input', 'Sample Product!');
  await page.fill('#price-input', '-1.00');
  await page.fill('#stock_quantity-input', 'abc');
  await page.fill('#category-input', 'Electronics#');
  await page.fill('#brand-input', '');
  await page.fill('#image_url-input', 'invalid-url');
  await page.fill('#description-input', 'This is a sample product with invalid data.');

  // Submit the form
  await Promise.all([
    page.waitForNavigation(),
    page.click('#submit-button')
  ]);

  // TODO: Add assertions to check for error messages or validation failures
  // Example:
  // expect(await page.locator('.error-message').isVisible()).toBe(true);
});
