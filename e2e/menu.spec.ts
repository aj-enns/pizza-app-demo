import { test, expect } from '@playwright/test';

function getPizzaCard(page: import('@playwright/test').Page, pizzaName: string) {
  return page.locator('.card').filter({
    has: page.getByRole('heading', { name: pizzaName, exact: true }),
  }).first();
}

test.describe('Menu Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/menu');
  });

  // --- Positive Scenarios ---

  test('should display the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /our menu/i })).toBeVisible();
  });

  test('should display all pizza cards from the menu', async ({ page }) => {
    // The menu has 8 pizzas defined in menu.json
    const pizzaNames = [
      'Margherita',
      'Pepperoni',
      'BBQ Chicken',
      'Veggie Supreme',
      'Meat Lovers',
      'Hawaiian',
      'Four Cheese',
      'Spicy Italian',
    ];

    for (const name of pizzaNames) {
      await expect(page.getByRole('heading', { name })).toBeVisible();
    }
  });

  test('should display pizza prices', async ({ page }) => {
    // All cards should show a price (starts with $)
    const prices = page.locator('text=/\\$\\d+\\.\\d{2}/');
    await expect(prices.first()).toBeVisible();
  });

  test('should display size selector buttons on each card', async ({ page }) => {
    // Each pizza card has size buttons; check the first card has them
    const firstCard = getPizzaCard(page, 'Margherita');
    await expect(firstCard.getByRole('button', { name: 'Small' })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: 'Medium' })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: 'Large', exact: true })).toBeVisible();
  });

  test('should display category badges on pizza cards', async ({ page }) => {
    await expect(page.getByText('classic').first()).toBeVisible();
    await expect(page.getByText('specialty').first()).toBeVisible();
  });

  test('should change price when selecting a different size', async ({ page }) => {
    const firstCard = getPizzaCard(page, 'Margherita');
    const mainPrice = firstCard.locator('span.text-3xl.font-bold.text-primary-600.dark\\:text-primary-500');

    // Get default (medium) price
    const mediumPrice = await mainPrice.textContent();

    // Click small size
    await firstCard.getByRole('button', { name: /small/i }).click();
    const smallPrice = await mainPrice.textContent();

    // Small should be less than medium
    expect(smallPrice).not.toBe(mediumPrice);
  });

  test('should add a pizza to cart and update cart badge', async ({ page }) => {
    const firstCard = getPizzaCard(page, 'Margherita');
    await firstCard.getByRole('button', { name: /add to cart/i }).click();

    // Button should briefly show "Added!"
    await expect(firstCard.getByText('Added!')).toBeVisible();

    // Cart badge in header should show count
    const badge = page.locator('header span.bg-primary-600');
    await expect(badge).toHaveText('1');
  });

  test('should add multiple pizzas and increment cart badge', async ({ page }) => {
    const margheritaCard = getPizzaCard(page, 'Margherita');
    const pepperoniCard = getPizzaCard(page, 'Pepperoni');
    await margheritaCard.getByRole('button', { name: /add to cart/i }).click();
    // Wait for button to reset
    await expect(margheritaCard.getByRole('button', { name: /add to cart/i })).toBeVisible();
    await pepperoniCard.getByRole('button', { name: /add to cart/i }).click();

    const badge = page.locator('header span.bg-primary-600');
    await expect(badge).toHaveText('2');
  });

  // --- Negative Scenarios ---

  test('should disable add to cart button briefly after adding', async ({ page }) => {
    const firstCard = getPizzaCard(page, 'Margherita');
    const addButton = firstCard.getByRole('button', { name: /add to cart/i });
    await addButton.click();

    // Button should change to "Added!" and be disabled
    const addedButton = firstCard.getByRole('button', { name: /added/i });
    await expect(addedButton).toBeDisabled();

    // Should revert back to "Add to Cart" after ~1 second
    await expect(addButton).toBeVisible({ timeout: 3000 });
    await expect(addButton).toBeEnabled();
  });
});
