import { test, expect } from '@playwright/test';

test.describe('Build Your Own Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/build-your-own');
  });

  // --- Rendering & Layout ---

  test('should display the build your own page with all sections', async ({ page }) => {
    await expect(page.locator('[data-testid="pizza-builder"]')).toBeVisible();
    await expect(page.locator('[data-testid="size-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="sauce-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="toppings-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-to-cart-builder"]')).toBeVisible();
  });

  // --- Default State ---

  test('should show default size (medium) and sauce (tomato sauce) selected', async ({ page }) => {
    const sizeSelector = page.locator('[data-testid="size-selector"]');
    const mediumButton = sizeSelector.getByRole('button', { name: /medium/i });
    await expect(mediumButton).toHaveClass(/border-primary-600/);

    const sauceSelector = page.locator('[data-testid="sauce-selector"]');
    const tomatoButton = sauceSelector.getByRole('button', { name: /tomato sauce/i });
    await expect(tomatoButton).toHaveClass(/border-primary-600/);
  });

  test('should show base price with no toppings selected', async ({ page }) => {
    const pricePreview = page.locator('[data-testid="price-preview"]');
    // Medium base: $9.99 * 1.0 = $9.99
    await expect(pricePreview.getByText('$9.99').first()).toBeVisible();
  });

  // --- Size Selection ---

  test('should update price when changing size', async ({ page }) => {
    const sizeSelector = page.locator('[data-testid="size-selector"]');
    const pricePreview = page.locator('[data-testid="price-preview"]');

    // Default medium: $9.99
    await expect(pricePreview.getByText('$9.99').first()).toBeVisible();

    // Click small: $9.99 * 0.8 = $7.99
    await sizeSelector.getByRole('button', { name: /small/i }).click();
    await expect(pricePreview.getByText('$7.99').first()).toBeVisible();

    // Click large: $9.99 * 1.3 = $12.99
    await sizeSelector.getByRole('button', { name: /^large\b/i }).click();
    await expect(pricePreview.getByText('$12.99').first()).toBeVisible();

    // Click xlarge: $9.99 * 1.6 = $15.98
    await sizeSelector.getByRole('button', { name: /x-large/i }).click();
    await expect(pricePreview.getByText('$15.98').first()).toBeVisible();
  });

  // --- Sauce Selection ---

  test('should change sauce selection', async ({ page }) => {
    const sauceSelector = page.locator('[data-testid="sauce-selector"]');

    // Switch to BBQ Sauce
    await sauceSelector.getByRole('button', { name: /bbq sauce/i }).click();
    await expect(sauceSelector.getByRole('button', { name: /bbq sauce/i })).toHaveClass(/border-primary-600/);
    // Tomato should no longer be selected
    await expect(sauceSelector.getByRole('button', { name: /tomato sauce/i })).not.toHaveClass(/border-primary-600/);

    // Switch to White Sauce
    await sauceSelector.getByRole('button', { name: /white sauce/i }).click();
    await expect(sauceSelector.getByRole('button', { name: /white sauce/i })).toHaveClass(/border-primary-600/);
  });

  // --- Toppings Selection ---

  test('should group toppings by category', async ({ page }) => {
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');
    await expect(toppingsSelector.getByText(/cheese/i)).toBeVisible();
    await expect(toppingsSelector.getByText(/meat/i)).toBeVisible();
    await expect(toppingsSelector.getByText(/vegetable/i)).toBeVisible();
  });

  test('should toggle toppings on and off', async ({ page }) => {
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');
    const pepperoniButton = toppingsSelector.getByRole('button', { name: /pepperoni/i });

    // Toggle on
    await pepperoniButton.click();
    await expect(pepperoniButton).toHaveClass(/border-primary-600/);

    // Toggle off
    await pepperoniButton.click();
    await expect(pepperoniButton).not.toHaveClass(/border-primary-600/);
  });

  test('should update price when selecting toppings', async ({ page }) => {
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');
    const pricePreview = page.locator('[data-testid="price-preview"]');

    // Add pepperoni ($2.00): $9.99 + $2.00 = $11.99
    await toppingsSelector.getByRole('button', { name: /pepperoni/i }).click();
    await expect(pricePreview.getByText('$11.99').first()).toBeVisible();

    // Add mushrooms ($1.50): $9.99 + $2.00 + $1.50 = $13.49
    await toppingsSelector.getByRole('button', { name: /mushrooms/i }).click();
    await expect(pricePreview.getByText('$13.49').first()).toBeVisible();

    // Remove pepperoni: $9.99 + $1.50 = $11.49
    await toppingsSelector.getByRole('button', { name: /pepperoni/i }).click();
    await expect(pricePreview.getByText('$11.49').first()).toBeVisible();
  });

  test('should show correct price with multiple toppings selected', async ({ page }) => {
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');
    const pricePreview = page.locator('[data-testid="price-preview"]');

    // Add Pepperoni ($2), Bacon ($2.50), Mushrooms ($1.50), Mozzarella ($0)
    await toppingsSelector.getByRole('button', { name: /pepperoni/i }).click();
    await toppingsSelector.getByRole('button', { name: /bacon/i }).click();
    await toppingsSelector.getByRole('button', { name: /mushrooms/i }).click();
    await toppingsSelector.getByRole('button', { name: /mozzarella/i }).click();

    // $9.99 + $2.00 + $2.50 + $1.50 + $0 = $15.99
    await expect(pricePreview.getByText('$15.99').first()).toBeVisible();
  });

  // --- Add to Cart ---

  test('should add custom pizza to cart and show in cart page', async ({ page }) => {
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');

    // Select some toppings
    await toppingsSelector.getByRole('button', { name: /pepperoni/i }).click();
    await toppingsSelector.getByRole('button', { name: /mushrooms/i }).click();

    // Add to cart
    const addButton = page.locator('[data-testid="add-to-cart-builder"]');
    await addButton.click();

    // Should show confirmation
    await expect(page.getByText('Added!')).toBeVisible();

    // Cart badge should update
    const badge = page.locator('header span.bg-primary-600');
    await expect(badge).toHaveText('1');

    // Navigate to cart and verify item
    await page.locator('header a[href="/cart"]').click();
    await page.waitForURL('/cart');

    await expect(page.getByRole('heading', { name: 'Build Your Own', exact: true })).toBeVisible();
  });

  test('should show "Added!" confirmation and disable button temporarily', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-to-cart-builder"]');
    await addButton.click();

    await expect(page.getByText('Added!')).toBeVisible();
    await expect(addButton).toBeDisabled();

    // Should re-enable after short delay
    await expect(addButton).toBeEnabled({ timeout: 3000 });
  });

  // --- Navigation ---

  test('should navigate to build your own from header link', async ({ page }) => {
    // Start from homepage
    await page.goto('/');
    await page.locator('header').getByRole('link', { name: /build your own/i }).click();
    await expect(page).toHaveURL('/build-your-own');
    await expect(page.locator('[data-testid="pizza-builder"]')).toBeVisible();
  });

  // --- Cart Persistence ---

  test('should persist custom pizza in cart across page refresh', async ({ page }) => {
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');

    // Build a pizza with pepperoni
    await toppingsSelector.getByRole('button', { name: /pepperoni/i }).click();
    await page.locator('[data-testid="add-to-cart-builder"]').click();
    await expect(page.getByText('Added!')).toBeVisible();

    // Navigate to cart
    await page.locator('header a[href="/cart"]').click();
    await page.waitForURL('/cart');
    await expect(page.getByRole('heading', { name: 'Build Your Own', exact: true })).toBeVisible();

    // Refresh
    await page.reload();

    // Item should still be in cart
    await expect(page.getByRole('heading', { name: 'Build Your Own', exact: true })).toBeVisible();
  });

  // --- Stress / Edge Cases ---

  test('should handle selecting all toppings (stress test price calculation)', async ({ page }) => {
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');

    // Click every topping button in the toppings selector
    const toppingButtons = toppingsSelector.getByRole('button');
    const count = await toppingButtons.count();

    for (let i = 0; i < count; i++) {
      await toppingButtons.nth(i).click();
    }

    // Price preview should show a valid price (not NaN or broken)
    const pricePreview = page.locator('[data-testid="price-preview"]');
    const priceText = await pricePreview.textContent();
    expect(priceText).toMatch(/\$\d+\.\d{2}/);

    // All toppings cost for medium:
    // Cheese: 0 + 1.50 + 2.00 + 1.50 = $5.00
    // Meat: 2.00 + 2.00 + 2.50 + 2.50 + 2.00 + 3.00 = $14.00
    // Vegetable: 1.50 + 1.50 + 1.00 + 1.00 + 1.50 + 1.50 + 1.50 + 1.00 + 1.00 + 0.50 = $12.00
    // Base medium: $9.99
    // Total: $9.99 + $5.00 + $14.00 + $12.00 = $40.99
    await expect(pricePreview.getByText('$40.99').first()).toBeVisible();
  });

  test('should combine size and topping price changes correctly', async ({ page }) => {
    const sizeSelector = page.locator('[data-testid="size-selector"]');
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');
    const pricePreview = page.locator('[data-testid="price-preview"]');

    // Select large ($9.99 * 1.3 = $12.99)
    await sizeSelector.getByRole('button', { name: /^large\b/i }).click();
    await expect(pricePreview.getByText('$12.99').first()).toBeVisible();

    // Add grilled chicken ($3.00)
    await toppingsSelector.getByRole('button', { name: /grilled chicken/i }).click();
    // $12.99 + $3.00 = $15.99
    await expect(pricePreview.getByText('$15.99').first()).toBeVisible();

    // Change to small ($9.99 * 0.8 = $7.99 + $3.00 = $10.99)
    await sizeSelector.getByRole('button', { name: /small/i }).click();
    await expect(pricePreview.getByText('$10.99').first()).toBeVisible();
  });
});

test.describe('Build Your Own — Full Order Flow', () => {
  test('should build custom pizza, add to cart, and complete checkout', async ({ page }) => {
    // 1. Go to build your own page
    await page.goto('/build-your-own');
    await expect(page.locator('[data-testid="pizza-builder"]')).toBeVisible();

    // 2. Select large size
    const sizeSelector = page.locator('[data-testid="size-selector"]');
    await sizeSelector.getByRole('button', { name: /^large\b/i }).click();

    // 3. Select BBQ sauce
    const sauceSelector = page.locator('[data-testid="sauce-selector"]');
    await sauceSelector.getByRole('button', { name: /bbq sauce/i }).click();

    // 4. Add toppings: Pepperoni, Bacon, Mushrooms
    const toppingsSelector = page.locator('[data-testid="toppings-selector"]');
    await toppingsSelector.getByRole('button', { name: /pepperoni/i }).click();
    await toppingsSelector.getByRole('button', { name: /bacon/i }).click();
    await toppingsSelector.getByRole('button', { name: /mushrooms/i }).click();

    // 5. Verify price: large base ($12.99) + pepperoni ($2) + bacon ($2.50) + mushrooms ($1.50) = $18.99
    const pricePreview = page.locator('[data-testid="price-preview"]');
    await expect(pricePreview.getByText('$18.99').first()).toBeVisible();

    // 6. Add to cart
    await page.locator('[data-testid="add-to-cart-builder"]').click();
    await expect(page.getByText('Added!')).toBeVisible();

    // 7. Navigate to cart
    await page.locator('header a[href="/cart"]').click();
    await page.waitForURL('/cart');

    // 8. Verify custom pizza in cart
    await expect(page.getByRole('heading', { name: 'Build Your Own', exact: true })).toBeVisible();
    await expect(page.getByText('Subtotal')).toBeVisible();
    await expect(page.getByText('Tax')).toBeVisible();
    await expect(page.getByText('Delivery Fee')).toBeVisible();

    // 9. Proceed to checkout via SPA navigation
    await page.getByRole('link', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL('/checkout');

    // 10. Fill checkout form
    await page.getByLabel(/full name/i).fill('Custom Pizza Lover');
    await page.getByLabel(/phone number/i).fill('(555) 777-1234');
    await page.getByLabel(/email address/i).fill('custom@test.com');
    await page.getByLabel(/street address/i).fill('42 Builder Ave');
    await page.getByLabel(/city/i).fill('Pizzatown');
    await page.getByLabel(/zip code/i).fill('90210');

    // 11. Place order
    await page.getByRole('button', { name: /place order/i }).click();

    // 12. Verify confirmation
    await expect(page).toHaveURL(/\/order-confirmation\?orderId=/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /order confirmed/i })).toBeVisible();
    await expect(page.getByRole('main').getByText('Build Your Own', { exact: true })).toBeVisible();
  });
});
