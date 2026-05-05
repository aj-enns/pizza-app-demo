import { test, expect } from '@playwright/test';

test.describe('Full Order Flow (E2E Happy Path)', () => {
  test('should complete an entire order from browsing to confirmation', async ({ page }) => {
    // 1. Start on homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /hot & fresh pizza/i })).toBeVisible();

    // 2. Navigate to menu
    await page.getByRole('link', { name: /order now/i }).click();
    await expect(page).toHaveURL('/menu');

    // 3. Add first pizza (Margherita) with large size
    const firstCard = page.locator('.card').first();
    await firstCard.getByRole('button', { name: 'Large', exact: true }).click();
    await firstCard.getByRole('button', { name: /add to cart/i }).click();
    await expect(firstCard.getByText('Added!')).toBeVisible();

    // 4. Add second pizza (Pepperoni) with default medium size
    const secondCard = page.locator('.card').nth(1);
    await secondCard.getByRole('button', { name: /add to cart/i }).click();
    await expect(secondCard.getByText('Added!')).toBeVisible();

    // Cart badge should show 2 items
    const badge = page.locator('header span.bg-primary-600');
    await expect(badge).toHaveText('2');

    // 5. Go to cart (wait for items to appear from localStorage)
    await page.locator('header a[href="/cart"]').click();
    await expect(page).toHaveURL('/cart');

    // Both pizzas should be visible
    await expect(page.getByRole('heading', { name: 'Margherita' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pepperoni' })).toBeVisible();

    // 6. Increase Margherita quantity
    const increaseButtons = page.getByRole('button', { name: /increase quantity/i });
    await increaseButtons.first().click();

    // Badge should now be 3
    await expect(badge).toHaveText('3');

    // 7. Proceed to checkout (SPA navigation)
    await page.getByRole('link', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL('/checkout');

    // 8. Fill checkout form
    await page.getByLabel(/full name/i).fill('E2E Test User');
    await page.getByLabel(/phone number/i).fill('(555) 999-8888');
    await page.getByLabel(/email address/i).fill('e2e@test.com');
    await page.getByLabel(/street address/i).fill('100 E2E Boulevard');
    await page.getByLabel(/city/i).fill('Testopolis');
    await page.getByLabel(/zip code/i).fill('12345');
    await page.getByLabel(/delivery instructions/i).fill('Leave at the door');

    // 9. Place order
    await page.getByRole('button', { name: /place order/i }).click();

    // 10. Verify order confirmation
    await expect(page).toHaveURL(/\/order-confirmation\?orderId=/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
    await expect(page.getByText(/order number/i)).toBeVisible();
    await expect(page.getByText('100 E2E Boulevard')).toBeVisible();
    await expect(page.getByText(/testopolis/i)).toBeVisible();
    await expect(page.getByText('Margherita')).toBeVisible();
    await expect(page.getByText('Pepperoni')).toBeVisible();
    await expect(page.getByText(/30-45 minutes/i)).toBeVisible();

    // 11. Cart should be cleared
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /your cart is empty/i })).toBeVisible();
  });
});
