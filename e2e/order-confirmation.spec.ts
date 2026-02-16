import { test, expect } from '@playwright/test';

test.describe('Order Confirmation Page', () => {
  /**
   * Helper: goes through the full checkout flow via SPA navigation and returns the confirmation page.
   */
  async function placeOrder(page: import('@playwright/test').Page) {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
    // Wait for the button to show "Added!" before navigating
    await expect(page.locator('.card').first().getByRole('button', { name: /added/i })).toBeVisible();

    // Navigate to cart, wait for item to appear (proves localStorage loaded)
    await page.goto('/cart');
    await expect(page.getByText(/margherita/i)).toBeVisible();

    // Navigate to checkout via SPA link
    await page.getByRole('link', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL('/checkout');

    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/phone number/i).fill('(555) 000-1111');
    await page.getByLabel(/email address/i).fill('test@test.com');
    await page.getByLabel(/street address/i).fill('789 Test Road');
    await page.getByLabel(/city/i).fill('Testville');
    await page.getByLabel(/zip code/i).fill('99999');

    await page.getByRole('button', { name: /place order/i }).click();
    await expect(page).toHaveURL(/\/order-confirmation\?orderId=/, { timeout: 15000 });
  }

  // --- Positive Scenarios ---

  test('should display order confirmed heading', async ({ page }) => {
    await placeOrder(page);
    await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
  });

  test('should display order number', async ({ page }) => {
    await placeOrder(page);
    await expect(page.getByText(/order number/i)).toBeVisible();
  });

  test('should display delivery estimate', async ({ page }) => {
    await placeOrder(page);
    await expect(page.getByText(/30-45 minutes/i)).toBeVisible();
  });

  test('should display delivery address', async ({ page }) => {
    await placeOrder(page);
    await expect(page.getByText('789 Test Road')).toBeVisible();
    await expect(page.getByText(/testville/i)).toBeVisible();
  });

  test('should display order items', async ({ page }) => {
    await placeOrder(page);
    await expect(page.getByText(/margherita/i)).toBeVisible();
  });

  test('should display order totals (subtotal, tax, delivery, total)', async ({ page }) => {
    await placeOrder(page);
    await expect(page.getByText(/subtotal/i)).toBeVisible();
    await expect(page.getByText(/tax/i)).toBeVisible();
    await expect(page.getByText(/delivery fee/i)).toBeVisible();
    await expect(page.getByText(/total/i).last()).toBeVisible();
  });

  test('should display Order Again link back to menu', async ({ page }) => {
    await placeOrder(page);
    const orderAgainLink = page.getByRole('link', { name: /order again/i });
    await expect(orderAgainLink).toBeVisible();

    await orderAgainLink.click();
    await expect(page).toHaveURL('/menu');
  });

  test('should have cleared the cart after order', async ({ page }) => {
    await placeOrder(page);

    // Navigate to cart — should be empty
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
  });

  // --- Negative Scenarios ---

  test('should show "Order not found" for invalid order ID', async ({ page }) => {
    await page.goto('/order-confirmation?orderId=invalid-id-12345');

    // Wait for loading to finish and the not-found state to appear
    await expect(page.getByText('Order not found')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /back to menu/i })).toBeVisible();
  });

  test('should show \"Order not found\" when no order ID is provided', async ({ page }) => {
    await page.goto('/order-confirmation');

    // With no orderId param, the page shows loading then not-found
    await expect(page.getByText('Order not found')).toBeVisible({ timeout: 10000 });
  });
});
