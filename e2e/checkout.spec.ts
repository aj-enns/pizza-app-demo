import { test, expect } from '@playwright/test';

/**
 * Helper: adds a pizza to the cart and navigates to checkout via SPA links
 * (to avoid the race condition where checkout redirects before localStorage loads).
 */
async function addPizzaAndGoToCheckout(page: import('@playwright/test').Page) {
  await page.goto('/menu');
  await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
  // Wait for add confirmation
  await expect(page.locator('.card').first().getByText('Added!')).toBeVisible();
  // Navigate to cart, wait for item to appear (proving localStorage loaded)
  await page.goto('/cart');
  await expect(page.getByText(/margherita/i)).toBeVisible();
  // Use SPA link to checkout (avoids full page refresh race)
  await page.getByRole('link', { name: /proceed to checkout/i }).click();
  await expect(page).toHaveURL('/checkout');
}

test.describe('Checkout Page', () => {
  // --- Positive Scenarios ---

  test('should display checkout form with all required fields', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/phone number/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/street address/i)).toBeVisible();
    await expect(page.getByLabel(/city/i)).toBeVisible();
    await expect(page.getByLabel(/zip code/i)).toBeVisible();
    await expect(page.getByLabel(/delivery instructions/i)).toBeVisible();
  });

  test('should display order summary on checkout page', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Tax')).toBeVisible();
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
  });

  test('should have a Place Order button', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    await expect(page.getByRole('button', { name: /place order/i })).toBeVisible();
  });

  test('should successfully submit order with valid data', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    // Fill all required fields
    await page.getByLabel(/full name/i).fill('John Doe');
    await page.getByLabel(/phone number/i).fill('(555) 123-4567');
    await page.getByLabel(/email address/i).fill('john@example.com');
    await page.getByLabel(/street address/i).fill('123 Main Street');
    await page.getByLabel(/city/i).fill('New York');
    await page.getByLabel(/zip code/i).fill('10001');
    await page.getByLabel(/delivery instructions/i).fill('Ring the bell twice');

    // Submit
    await page.getByRole('button', { name: /place order/i }).click();

    // Should redirect to order confirmation
    await expect(page).toHaveURL(/\/order-confirmation\?orderId=/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
  });

  test('should show loading state while submitting', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    await page.getByLabel(/full name/i).fill('John Doe');
    await page.getByLabel(/phone number/i).fill('(555) 123-4567');
    await page.getByLabel(/email address/i).fill('john@example.com');
    await page.getByLabel(/street address/i).fill('123 Main Street');
    await page.getByLabel(/city/i).fill('New York');
    await page.getByLabel(/zip code/i).fill('10001');

    await page.getByRole('button', { name: /place order/i }).click();

    // Should briefly show "Processing..." text
    await expect(page.getByText(/processing/i)).toBeVisible({ timeout: 3000 });
  });

  // --- Negative Scenarios ---

  test('should redirect to cart when accessing checkout with empty cart', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/checkout');

    // The checkout page detects empty cart and redirects to /cart via useEffect
    await expect(page).toHaveURL('/cart', { timeout: 15000 });
  });

  test('should not submit form with empty required fields', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    // Try to submit without filling fields
    await page.getByRole('button', { name: /place order/i }).click();

    // Should stay on checkout page (HTML5 validation prevents submission)
    await expect(page).toHaveURL('/checkout');
  });

  test('should not submit with invalid email', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    await page.getByLabel(/full name/i).fill('John Doe');
    await page.getByLabel(/phone number/i).fill('(555) 123-4567');
    await page.getByLabel(/email address/i).fill('not-an-email');
    await page.getByLabel(/street address/i).fill('123 Main Street');
    await page.getByLabel(/city/i).fill('New York');
    await page.getByLabel(/zip code/i).fill('10001');

    await page.getByRole('button', { name: /place order/i }).click();

    // Should stay on checkout due to email validation
    await expect(page).toHaveURL('/checkout');
  });

  test('should allow submission without optional delivery instructions', async ({ page }) => {
    await addPizzaAndGoToCheckout(page);

    await page.getByLabel(/full name/i).fill('Jane Smith');
    await page.getByLabel(/phone number/i).fill('(555) 987-6543');
    await page.getByLabel(/email address/i).fill('jane@example.com');
    await page.getByLabel(/street address/i).fill('456 Oak Avenue');
    await page.getByLabel(/city/i).fill('Chicago');
    await page.getByLabel(/zip code/i).fill('60601');

    // Do NOT fill delivery instructions
    await page.getByRole('button', { name: /place order/i }).click();

    await expect(page).toHaveURL(/\/order-confirmation\?orderId=/, { timeout: 10000 });
  });
});
