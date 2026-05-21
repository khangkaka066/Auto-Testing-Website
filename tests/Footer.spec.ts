import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:3000';

// TC001 - Navigation Link Presence
(async () => {
  test('Footer should have the Privacy Policy link', async ({ page }) => {
    await page.goto(baseUrl);
    const privacyPolicyLink = page.locator('.footer a[href="/privacy-policy"]');
    expect(privacyPolicyLink).toBeVisible();
    expect(await privacyPolicyLink.textContent()).toBe('Privacy Policy');
  });
})()

// TC002 - Navigation Link Clickability
(async () => {
  test('Privacy Policy link should be clickable', async ({ page }) => {
    await page.goto(baseUrl);
    const privacyPolicyLink = page.locator('.footer a[href="/privacy-policy"]');
    expect(privacyPolicyLink).toBeVisible();
    expect(privacyPolicyLink).not.toBeDisabled();

    await privacyPolicyLink.click();
    // Add assertion based on expected behavior after clicking the link
  });
})()
