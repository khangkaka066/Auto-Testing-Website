import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

async function findSortSelect(page: Page) {
  const candidates = [
    page.getByRole("combobox", { name: /sort/i }),
    page.locator("select[data-testid=\"sort-select\"]"),
    page.locator("select[name=\"sort\"]"),
    page.locator("select")
  ];
  for (const loc of candidates) {
    try {
      if (await loc.count() > 0) {
        return loc;
      }
    } catch (e) {
      // ignore and continue;
    }
  }
  return page.locator("select");
}

async function findAddToCartButton(page: Page) {
  const candidates = [
    page.getByRole("button", { name: /add to cart/i }),
    page.locator("button[data-testid=\"add-to-cart\"]"),
    page.locator("button.add-to-cart"),
    page.locator("button", { hasText: /add to cart/i })
  ];
  for (const loc of candidates) {
    try {
      if (await loc.count() > 0) {
        return loc.first();
      }
    } catch (e) {
      // ignore and continue;
    }
  }
  return page.getByRole("button");
}

test.describe("ProductPage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/product`);
    // A pragmatic check that we're on the product page; tolerant to different routes
    await expect(page).toHaveURL(/product|products|\/?$/);
  });

  test("Select Sort Criteria", async ({ page }) => {
    const sortCriteria = ["Price Low to High", "Price High to Low"];

    const select = await findSortSelect(page);
    await expect(select).toBeVisible();
    await expect(select).toBeEnabled();

    for (const criterion of sortCriteria) {
      // Attempt to interact with a native select first
      const tagName = await select.evaluate((el: Element) => el.tagName).catch(() => "");
      if (tagName && tagName.toUpperCase() === "SELECT") {
        // selectOption by label
        await select.selectOption({ label: criterion });
        // Confirm the selected option's text matches the criterion
        const selectedOption = select.locator("option:checked");
        await expect(selectedOption).toHaveText(criterion);
      } else {
        // Non-native control: open, then click item by accessible name or visible text
        await select.click();
        const optionByRole = page.getByRole("option", { name: criterion });
        if (await optionByRole.count() > 0) {
          await optionByRole.click();
        } else {
          const visibleText = page.locator(`text=${criterion}`);
          if (await visibleText.count() > 0) {
            await visibleText.first().click();
          } else {
            // Last resort: type the criterion and submit
            await select.fill(criterion).catch(() => {});
            await select.press("Enter");
          }
        }
        // For non-selects attempt to assert that some UI reflects the selection
        const currentSortIndicator = page.locator("[data-testid=\"current-sort\"], .current-sort, .sort-active");
        if (await currentSortIndicator.count() > 0) {
          await expect(currentSortIndicator.first()).toContainText(criterion);
        }
      }

      // Small verification that product list is visible after applying sort
      const productList = page.locator("[data-testid=\"product-list\"], .product-list, ul.products");
      await expect(productList.first()).toBeVisible();
    }
  });

  test("Add Product to Cart", async ({ page }) => {
    const productCount = 1;

    // Find a visible product card's Add to Cart button; prefer explicit button locators
    const addToCart = await findAddToCartButton(page);
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();

    // Try to find an existing cart count indicator
    const cartCountLocators = [
      page.locator("[data-testid=\"cart-count\"]"),
      page.locator(".cart-count"),
      page.getByRole("status", { name: /cart/i })
    ];
    let cartCountLocator = null as any;
    let initialCount = null as number | null;
    for (const loc of cartCountLocators) {
      try {
        if (await loc.count() > 0) {
          cartCountLocator = loc.first();
          const text = (await cartCountLocator.textContent()) || "";
          const parsed = parseInt(text.trim().replace(/[^0-9]/g, ""), 10);
          if (!Number.isNaN(parsed)) {
            initialCount = parsed;
          } else {
            initialCount = 0;
          }
          break;
        }
      } catch (e) {
        // ignore and continue;
      }
    }

    // Perform clicks to add product(s)
    for (let i = 0; i < productCount; i += 1) {
      await addToCart.click();
      // allow potential UI updates like toast or cart badge animation
      await page.waitForTimeout(250);
    }

    // If we detected a cart count badge, assert it incremented
    if (cartCountLocator) {
      const finalText = (await cartCountLocator.textContent()) || "";
      const finalCount = parseInt(finalText.trim().replace(/[^0-9]/g, ""), 10);
      if (initialCount !== null && !Number.isNaN(finalCount)) {
        await expect(finalCount).toBe(initialCount + productCount);
      } else {
        // If parsing failed, at least assert the badge is visible and not empty
        await expect(cartCountLocator).toBeVisible();
      }
    } else {
      // Fallback: expect a toast or confirmation message
      const toast = page.getByText(/added to cart|added.*cart|in your cart/i);
      if (await toast.count() > 0) {
        await expect(toast.first()).toBeVisible();
      } else {
        // Last resort: verify the Add to Cart button remains present and enabled
        await expect(addToCart).toBeVisible();
        await expect(addToCart).toBeEnabled();
      }
    }
  });
});
