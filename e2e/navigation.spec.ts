import { test, expect } from '@playwright/test';

test.describe('Navigation & Layout', () => {
  // --- Positive Scenarios ---

  test('should navigate between all main pages via header links', async ({ page }) => {
    await page.goto('/');

    // Navigate to Menu (scoped to header nav)
    await page.locator('header').getByRole('link', { name: 'Menu' }).click();
    await expect(page).toHaveURL('/menu');
    await expect(page.getByRole('heading', { name: /our menu/i })).toBeVisible();

    // Navigate to Cart
    await page.locator('header a[href="/cart"]').click();
    await expect(page).toHaveURL('/cart');

    // Navigate home via logo
    await page.getByRole('link', { name: /pizzahub/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should display sticky header on scroll', async ({ page }) => {
    await page.goto('/');

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should navigate to changelog from footer', async ({ page }) => {
    await page.goto('/');

    await page.locator('footer').getByRole('link', { name: /changelog/i }).click();
    await expect(page).toHaveURL('/changelog');
  });

  test('should have a theme toggle button', async ({ page }) => {
    await page.goto('/');

    // Theme toggle button should be present in the header
    const themeButton = page.locator('header button').filter({ has: page.locator('svg') }).last();
    await expect(themeButton).toBeVisible();
  });

  test('should display footer contact information', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer.getByText(/\(555\) 123-4567/)).toBeVisible();
    await expect(footer.getByText(/info@pizzahub.com/)).toBeVisible();
    await expect(footer.getByText(/123 pizza street/i)).toBeVisible();
  });

  test('should display footer quick links', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /menu/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /cart/i })).toBeVisible();
  });

  // --- Negative Scenarios ---

  test('should return 404 for non-existent routes', async ({ page }) => {
    const response = await page.goto('/non-existent-page');
    expect(response?.status()).toBe(404);
  });
});
