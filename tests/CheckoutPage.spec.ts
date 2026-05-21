import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function navigateToCheckoutPage(page) {
  await page.goto(`${BASE_URL}/checkout`);
}

// UI-01: Render UI Components

const UI_01_TEST_CASE = {
  case_id: 'UI-01',
  title: 'Render UI Components',
  priority: 'P0',
  scope: 'Functional Testing',
  objective: 'Verify that the 'CheckoutPage' renders correctly with all interactive elements.',
  preconditions: ['Ensure the application is running and accessible.'],
  test_data: {
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Elm St, Anytown, USA'
  }
};

test('UI-01: Render UI Components', async ({ page }) => {
  await navigateToCheckoutPage(page);

  // Assertions to check if all required elements are present and visible
  expect(await page.isVisible('#checkout-form')).toBe(true);
  expect(await page.isVisible('#payment-button')).toBe(true);
  expect(await page.isVisible('#address-input')).toBe(true);
});

// UI-02: Check for Errors During Rendering

const UI_02_TEST_CASE = {
  case_id: 'UI-02',
  title: 'Check for Errors During Rendering',
  priority: 'P0',
  scope: 'Functional Testing',
  objective: 'Verify that the 'CheckoutPage' renders all interactive elements without errors.',
  preconditions: ['Ensure the application is running and accessible.'],
  test_data: {
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Elm St, Anytown, USA'
  }
};

test('UI-02: Check for Errors During Rendering', async ({ page }) => {
  await navigateToCheckoutPage(page);

  // Assertions to check if there are no error messages displayed
  expect(await page.isVisible('#error-message')).toBe(false);
});

// UI-03: Check Responsiveness

const UI_03_TEST_CASE = {
  case_id: 'UI-03',
  title: 'Check Responsiveness',
  priority: 'P1',
  scope: 'Responsive Testing',
  objective: 'Verify that the 'CheckoutPage' is responsive under different screen sizes.',
  preconditions: ['Ensure the application is running and accessible.'],
  test_data: {
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Elm St, Anytown, USA'
  }
};

const UI_03_MEDIA_QUERIES = [
  { width: 640 },
  { width: 768 },
  { width: 1024 },
  { width: 1280 }
];

test.describe('UI-03: Check Responsiveness', () => {
  for (const mq of UI_03_MEDIA_QUERIES) {
    test(`Check on ${mq.width} width`, async ({ page }) => {
      await navigateToCheckoutPage(page);
      await page.setViewportSize(mq);

      // Assertions to check if the layout is as expected at this viewport size
      expect(await page.isVisible('#checkout-form')).toBe(true);
      expect(await page.isVisible('#payment-button')).toBe(true);
      expect(await page.isVisible('#address-input')).toBe(true);
    });
  }
});

// UI-04: Test Payment Initiation

const UI_04_TEST_CASE = {
  case_id: 'UI-04',
  title: 'Test Payment Initiation',
  priority: 'P2',
  scope: 'Functional Testing',
  objective: 'Verify that the 'CheckoutPage' functions correctly after initiating payment.',
  preconditions: ['Ensure the application is running and accessible.'],
  test_data: {
    name: 'John Doe',
    phone: '+1234567890',
    address: '123 Elm St, Anytown, USA'
  }
};

test('UI-04: Test Payment Initiation', async ({ page }) => {
  await navigateToCheckoutPage(page);

  // Fill out the form and initiate payment
  await page.fill('#name-input', UI_04_TEST_CASE.test_data.name);
  await page.fill('#phone-input', UI_04_TEST_CASE.test_data.phone);
  await page.fill('#address-input', UI_04_TEST_CASE.test_data.address);
  await page.click('#payment-button');

  // Assertions to check if payment was initiated successfully
  expect(await page.isVisible('#payment-confirmation')).toBe(true);
});
