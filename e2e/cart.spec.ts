import { test, expect } from '@playwright/test';

test.describe('Cart Page', () => {
  // --- Positive Scenarios ---

  test('should display empty cart message when no items', async ({ page }) => {
    // Clear localStorage before navigating
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/cart');

    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /browse menu/i })).toBeVisible();
  });

  test('should navigate to menu from empty cart', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/cart');

    await page.getByRole('link', { name: /browse menu/i }).click();
    await expect(page).toHaveURL('/menu');
  });

  test('should display cart items after adding from menu', async ({ page }) => {
    // Add a pizza first
    await page.goto('/menu');
    const firstCard = page.locator('.card').first();
    await firstCard.getByRole('button', { name: /add to cart/i }).click();

    // Navigate to cart
    await page.goto('/cart');

    // Should show the pizza name and quantity
    await expect(page.getByText(/margherita/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /your cart/i })).toBeVisible();
  });

  test('should display order summary with subtotal, tax, and delivery', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
    await page.goto('/cart');

    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Tax')).toBeVisible();
    await expect(page.getByText('Delivery Fee')).toBeVisible();
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
  });

  test('should update quantity when using quantity controls', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
    await page.goto('/cart');

    // Increase quantity
    const increaseButton = page.getByRole('button', { name: /increase quantity/i });
    await increaseButton.click();

    // Header badge should update to 2
    const badge = page.locator('header span.bg-primary-600');
    await expect(badge).toHaveText('2');
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
    await page.goto('/cart');

    // Click remove
    const removeButton = page.getByRole('button', { name: /remove item/i });
    await removeButton.click();

    // Cart should now be empty
    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
  });

  test('should have Proceed to Checkout link', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
    await page.goto('/cart');

    const checkoutLink = page.getByRole('link', { name: /proceed to checkout/i });
    await expect(checkoutLink).toBeVisible();
  });

  test('should navigate to checkout page', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
    await page.goto('/cart');

    await page.getByRole('link', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL('/checkout');
  });

  // --- Negative Scenarios ---

  test('should decrease quantity but not below 1', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();
    await page.goto('/cart');

    // Quantity is 1. Decreasing removes the item.
    const decreaseButton = page.getByRole('button', { name: /decrease quantity/i });
    await decreaseButton.click();
    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
  });

  test('should persist cart across page refresh', async ({ page }) => {
    await page.goto('/menu');
    await page.locator('.card').first().getByRole('button', { name: /add to cart/i }).click();

    // Reload and check cart
    await page.goto('/cart');
    await expect(page.getByText(/margherita/i)).toBeVisible();

    // Hard refresh
    await page.reload();
    await expect(page.getByText(/margherita/i)).toBeVisible();
  });
});
