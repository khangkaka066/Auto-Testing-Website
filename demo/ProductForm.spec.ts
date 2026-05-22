import { test, expect } from "@playwright/test";

test.describe(`ProductForm`, () => {
  const BASE_URL = "http://localhost:5173";

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);;
    await expect(page).toHaveURL(BASE_URL);;
  });

  test(`Display All Input Fields`, async ({ page }) => {
    const name = page.locator("input[name=\"name\"]");
    const price = page.locator("input[name=\"price\"]");
    const stock = page.locator("input[name=\"stock_quantity\"]");
    const category = page.locator("input[name=\"category\"]");
    const brand = page.locator("input[name=\"brand\"]");
    const image = page.locator("input[name=\"image_url\"]");
    const description = page.locator("textarea[name=\"description\"]");

    await expect(name).toBeVisible();;
    await expect(name).toBeEnabled();;

    await expect(price).toBeVisible();;
    await expect(price).toBeEnabled();;

    await expect(stock).toBeVisible();;
    await expect(stock).toBeEnabled();;

    await expect(category).toBeVisible();;
    await expect(category).toBeEnabled();;

    await expect(brand).toBeVisible();;
    await expect(brand).toBeEnabled();;

    await expect(image).toBeVisible();;
    await expect(image).toBeEnabled();;

    await expect(description).toBeVisible();;
    await expect(description).toBeEnabled();;

    const submit = page.locator("button[type=\"submit\"], button:has-text(\"Submit\"), button:has-text(\"Save\")");
    await expect(submit).toBeVisible();;

    const cancel = page.locator("button:has-text(\"Cancel\"), button[type=\"button\"]");
    await expect(cancel).toBeVisible();;
  });

  test(`Submit Valid Data`, async ({ page }) => {
    const data = {
      name: "Sample Product",
      price: "19.99",
      stock_quantity: "10",
      category: "Electronics",
      brand: "BrandX",
      image_url: "https://example.com/sample.jpg",
      description: "This is a sample product."
    };

    const name = page.locator("input[name=\"name\"]");
    const price = page.locator("input[name=\"price\"]");
    const stock = page.locator("input[name=\"stock_quantity\"]");
    const category = page.locator("input[name=\"category\"]");
    const brand = page.locator("input[name=\"brand\"]");
    const image = page.locator("input[name=\"image_url\"]");
    const description = page.locator("textarea[name=\"description\"]");
    const submit = page.locator("button[type=\"submit\"], button:has-text(\"Submit\"), button:has-text(\"Save\")");

    await name.fill(data.name);;
    await price.fill(data.price);;
    await stock.fill(data.stock_quantity);;
    await category.fill(data.category);;
    await brand.fill(data.brand);;
    await image.fill(data.image_url);;
    await description.fill(data.description);;

    await expect(name).toHaveValue(data.name);;
    await expect(price).toHaveValue(data.price);;
    await expect(stock).toHaveValue(data.stock_quantity);;

    // Attempt to submit the form and assert that no HTML5 invalid inputs exist after submit
    await submit.click();;

    // Wait briefly for client-side validation or submission to process
    await page.waitForTimeout(500);;

    const invalidCount = await page.locator(":invalid").count();
    await expect(invalidCount).toBe(0);;

    // If a success message is present, assert it's visible (non-fatal if not present)
    const successAlert = page.locator("role=alert >> text=success, text=Saved, text=Product");
    if (await successAlert.count() > 0) {
      await expect(successAlert.first()).toBeVisible();;
    }
  });

  test(`Cancel Form Submission`, async ({ page }) => {
    const name = page.locator("input[name=\"name\"]");
    const price = page.locator("input[name=\"price\"]");
    const description = page.locator("textarea[name=\"description\"]");
    const cancel = page.locator("button:has-text(\"Cancel\"), button[type=\"button\"]");

    await name.fill("Temporary Name");;
    await price.fill("9.99");;
    await description.fill("Temporary description");;

    await expect(name).toHaveValue("Temporary Name");;

    await cancel.click();;

    // After cancelling, the form fields should be cleared or the form should be hidden.
    // Check for cleared fields first
    await expect(name).toHaveValue("").catch(async () => {
      // If not cleared, allow that the page navigated away
      await expect(page).not.toHaveURL(BASE_URL);;
    });

    await expect(price).toHaveValue("").catch(async () => {
      await expect(page).not.toHaveURL(BASE_URL);;
    });

    await expect(description).toHaveValue("").catch(async () => {
      await expect(page).not.toHaveURL(BASE_URL);;
    });
  });

  test(`Input Fields with Empty Values`, async ({ page }) => {
    const name = page.locator("input[name=\"name\"]");
    const price = page.locator("input[name=\"price\"]");
    const stock = page.locator("input[name=\"stock_quantity\"]");
    const submit = page.locator("button[type=\"submit\"], button:has-text(\"Submit\"), button:has-text(\"Save\")");

    // Ensure fields are empty
    await name.fill("");;
    await price.fill("");;
    await stock.fill("");;

    // Try to submit
    await submit.click();;

    // Expect client-side validation to prevent submission: either submit disabled or invalid inputs present
    const submitDisabled = await submit.isDisabled();
    const invalidCount = await page.locator(":invalid").count();

    await expect(submitDisabled || invalidCount > 0).toBeTruthy();;
  });

  test(`Input Fields with Invalid Data`, async ({ page }) => {
    const data = {
      name: "Sample Product!",
      price: "-1.00",
      stock_quantity: "abc",
      category: "Electronics#",
      brand: "",
      image_url: "invalid-url",
      description: "This is a sample product with invalid data."
    };

    const name = page.locator("input[name=\"name\"]");
    const price = page.locator("input[name=\"price\"]");
    const stock = page.locator("input[name=\"stock_quantity\"]");
    const category = page.locator("input[name=\"category\"]");
    const brand = page.locator("input[name=\"brand\"]");
    const image = page.locator("input[name=\"image_url\"]");
    const description = page.locator("textarea[name=\"description\"]");
    const submit = page.locator("button[type=\"submit\"], button:has-text(\"Submit\"), button:has-text(\"Save\")");

    await name.fill(data.name);;
    await price.fill(data.price);;
    await stock.fill(data.stock_quantity);;
    await category.fill(data.category);;
    await brand.fill(data.brand);;
    await image.fill(data.image_url);;
    await description.fill(data.description);;

    await submit.click();;

    // Expect validation errors for invalid inputs (HTML5 :invalid) or visible error messages
    const invalidCount = await page.locator(":invalid").count();
    const errorMessages = page.locator("text=invalid, text=error, text=required, text=must");

    await expect(invalidCount > 0 || (await errorMessages.count()) > 0).toBeTruthy();;
  });

});
