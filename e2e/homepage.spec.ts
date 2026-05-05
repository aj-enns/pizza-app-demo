import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // --- Positive Scenarios ---

  test('should display the hero section with heading and CTA', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /hot & fresh pizza/i })).toBeVisible();
    await expect(page.getByText(/delivered fast/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /order now/i })).toBeVisible();
  });

  test('should display the three feature cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /fast delivery/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /quality ingredients/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /free delivery/i })).toBeVisible();
  });

  test('should display the popular pizzas section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /popular pizzas/i })).toBeVisible();
  });

  test('should navigate to menu page when Order Now is clicked', async ({ page }) => {
    await page.getByRole('link', { name: /order now/i }).click();
    await expect(page).toHaveURL('/menu', { timeout: 10000 });
  });

  test('should display header with PizzaHub branding', async ({ page }) => {
    await expect(page.getByRole('link', { name: /pizzahub/i })).toBeVisible();
  });

  test('should display footer with version and changelog link', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer.getByText(/pizzahub/i).first()).toBeVisible();
    await expect(footer.getByRole('link', { name: /changelog/i })).toBeVisible();
  });

  // --- Negative Scenarios ---

  test('should show cart icon with no badge when cart is empty', async ({ page }) => {
    // The cart link has no text, only an SVG — select by href
    const cartLink = page.locator('header a[href="/cart"]');
    await expect(cartLink).toBeVisible();
    // Badge should not be visible when cart is empty
    const badge = cartLink.locator('span.bg-primary-600');
    await expect(badge).toBeHidden();
  });
});
