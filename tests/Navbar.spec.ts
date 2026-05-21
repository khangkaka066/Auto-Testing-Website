import { test, expect } from '@playwright/test';

// P0_1: Navigation Link
// Objective: Verify the navigation link works as expected.
test('Navigation Link', async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Click on the navigation link with URL "/home"
  const navLink = page.locator('a[href="/home"]');
  await expect(navLink).toBeVisible();
  await navLink.click();

  // Optionally, add an assertion to verify the expected destination
  await expect(page.url()).toBe('http://localhost:3000/home');
});

// P0_2: Search Functionality
// Objective: Verify the search input field and submit button work as expected.
test('Search Functionality', async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Fill the search input field with a query
  const searchInput = page.locator('input[type="search"]');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('example query');

  // Click the submit button to perform the search
  const searchButton = page.locator('button[type="submit"]');
  await expect(searchButton).toBeVisible();
  await searchButton.click();

  // Optionally, add an assertion to verify the expected results
  // This might involve checking for specific elements or text on the search results page
});
