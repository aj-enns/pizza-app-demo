import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PizzaBuilder from '../PizzaBuilder';
import { CartProvider } from '@/contexts/CartContext';

// Mock useCart to spy on addItem calls
const mockAddItem = jest.fn();
jest.mock('@/contexts/CartContext', () => {
  const actual = jest.requireActual('@/contexts/CartContext');
  return {
    ...actual,
    useCart: () => ({
      ...actual.useCart?.() ?? {},
      items: [],
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
      addItem: mockAddItem,
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
    }),
    CartProvider: actual.CartProvider,
  };
});

const renderBuilder = () => {
  return render(
    <CartProvider>
      <PizzaBuilder />
    </CartProvider>
  );
};

describe('PizzaBuilder', () => {
  beforeEach(() => {
    mockAddItem.mockClear();
  });

  // --- Rendering & Layout ---

  it('should render the builder with all main sections', () => {
    renderBuilder();

    expect(screen.getByTestId('pizza-builder')).toBeInTheDocument();
    expect(screen.getByTestId('size-selector')).toBeInTheDocument();
    expect(screen.getByTestId('sauce-selector')).toBeInTheDocument();
    expect(screen.getByTestId('toppings-selector')).toBeInTheDocument();
    expect(screen.getByTestId('price-preview')).toBeInTheDocument();
  });

  it('should render the add to cart button', () => {
    renderBuilder();

    expect(screen.getByTestId('add-to-cart-builder')).toBeInTheDocument();
  });

  // --- Size Selector ---

  it('should render all four size options', () => {
    renderBuilder();

    const sizeSelector = screen.getByTestId('size-selector');
    expect(within(sizeSelector).getByRole('button', { name: /small/i })).toBeInTheDocument();
    expect(within(sizeSelector).getByRole('button', { name: /medium/i })).toBeInTheDocument();
    expect(within(sizeSelector).getByRole('button', { name: /large/i, exact: false })).toBeInTheDocument();
    expect(within(sizeSelector).getByRole('button', { name: /x-large/i })).toBeInTheDocument();
  });

  it('should have medium size selected by default', () => {
    renderBuilder();

    const sizeSelector = screen.getByTestId('size-selector');
    const mediumButton = within(sizeSelector).getByRole('button', { name: /medium/i });
    expect(mediumButton).toHaveClass('border-primary-600');
  });

  it('should update selection when clicking a different size', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const sizeSelector = screen.getByTestId('size-selector');
    const largeButton = within(sizeSelector).getByRole('button', { name: 'Large', exact: true });
    await user.click(largeButton);

    expect(largeButton).toHaveClass('border-primary-600');
  });

  it('should update price preview when changing size', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const pricePreview = screen.getByTestId('price-preview');

    // Default medium price: $9.99 * 1.0 = $9.99
    expect(within(pricePreview).getByText(/\$9\.99/)).toBeInTheDocument();

    // Click small: $9.99 * 0.8 = $7.99
    const sizeSelector = screen.getByTestId('size-selector');
    await user.click(within(sizeSelector).getByRole('button', { name: /small/i }));

    await waitFor(() => {
      expect(within(pricePreview).getByText(/\$7\.99/)).toBeInTheDocument();
    });
  });

  it('should show xlarge price correctly', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const sizeSelector = screen.getByTestId('size-selector');
    await user.click(within(sizeSelector).getByRole('button', { name: /x-large/i }));

    // $9.99 * 1.6 = $15.98
    const pricePreview = screen.getByTestId('price-preview');
    await waitFor(() => {
      expect(within(pricePreview).getByText(/\$15\.98/)).toBeInTheDocument();
    });
  });

  // --- Sauce Selector ---

  it('should have tomato sauce selected by default', () => {
    renderBuilder();

    const sauceSelector = screen.getByTestId('sauce-selector');
    const tomatoButton = within(sauceSelector).getByRole('button', { name: /tomato sauce/i });
    expect(tomatoButton).toHaveClass('border-primary-600');
  });

  it('should change sauce when clicking a different option', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const sauceSelector = screen.getByTestId('sauce-selector');
    const bbqButton = within(sauceSelector).getByRole('button', { name: /bbq sauce/i });
    await user.click(bbqButton);

    expect(bbqButton).toHaveClass('border-primary-600');
    // Tomato should no longer be selected
    const tomatoButton = within(sauceSelector).getByRole('button', { name: /tomato sauce/i });
    expect(tomatoButton).not.toHaveClass('border-primary-600');
  });

  it('should render all three sauce options', () => {
    renderBuilder();

    const sauceSelector = screen.getByTestId('sauce-selector');
    expect(within(sauceSelector).getByRole('button', { name: /tomato sauce/i })).toBeInTheDocument();
    expect(within(sauceSelector).getByRole('button', { name: /bbq sauce/i })).toBeInTheDocument();
    expect(within(sauceSelector).getByRole('button', { name: /white sauce/i })).toBeInTheDocument();
  });

  // --- Toppings Selector ---

  it('should group toppings by category', () => {
    renderBuilder();

    const toppingsSelector = screen.getByTestId('toppings-selector');
    expect(within(toppingsSelector).getByText(/cheese/i)).toBeInTheDocument();
    expect(within(toppingsSelector).getByText(/meat/i)).toBeInTheDocument();
    expect(within(toppingsSelector).getByText(/vegetable/i)).toBeInTheDocument();
  });

  it('should toggle a topping on when clicked', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const toppingsSelector = screen.getByTestId('toppings-selector');
    const pepperoniButton = within(toppingsSelector).getByRole('button', { name: /pepperoni/i });
    await user.click(pepperoniButton);

    expect(pepperoniButton).toHaveClass('border-primary-600');
  });

  it('should toggle a topping off when clicked again', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const toppingsSelector = screen.getByTestId('toppings-selector');
    const pepperoniButton = within(toppingsSelector).getByRole('button', { name: /pepperoni/i });
    
    // Toggle on
    await user.click(pepperoniButton);
    expect(pepperoniButton).toHaveClass('border-primary-600');
    
    // Toggle off
    await user.click(pepperoniButton);
    expect(pepperoniButton).not.toHaveClass('border-primary-600');
  });

  it('should update price when selecting a topping', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const pricePreview = screen.getByTestId('price-preview');
    // Base medium price: $9.99
    expect(within(pricePreview).getByText(/\$9\.99/)).toBeInTheDocument();

    // Add pepperoni ($2.00)
    const toppingsSelector = screen.getByTestId('toppings-selector');
    await user.click(within(toppingsSelector).getByRole('button', { name: /pepperoni/i }));

    // $9.99 + $2.00 = $11.99
    await waitFor(() => {
      expect(within(pricePreview).getByText(/\$11\.99/)).toBeInTheDocument();
    });
  });

  it('should decrease price when deselecting a topping', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const pricePreview = screen.getByTestId('price-preview');
    const toppingsSelector = screen.getByTestId('toppings-selector');

    // Add pepperoni
    await user.click(within(toppingsSelector).getByRole('button', { name: /pepperoni/i }));
    await waitFor(() => {
      expect(within(pricePreview).getByText(/\$11\.99/)).toBeInTheDocument();
    });

    // Remove pepperoni
    await user.click(within(toppingsSelector).getByRole('button', { name: /pepperoni/i }));
    await waitFor(() => {
      expect(within(pricePreview).getByText(/\$9\.99/)).toBeInTheDocument();
    });
  });

  it('should show topping prices next to each topping', () => {
    renderBuilder();

    const toppingsSelector = screen.getByTestId('toppings-selector');
    // Pepperoni costs $2.00
    expect(within(toppingsSelector).getByText(/\$2\.00/)).toBeInTheDocument();
    // Grilled Chicken costs $3.00
    expect(within(toppingsSelector).getByText(/\$3\.00/)).toBeInTheDocument();
  });

  it('should calculate correct price with multiple toppings', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const toppingsSelector = screen.getByTestId('toppings-selector');
    const pricePreview = screen.getByTestId('price-preview');

    // Add pepperoni ($2.00) + mushrooms ($1.50) to medium base ($9.99)
    await user.click(within(toppingsSelector).getByRole('button', { name: /pepperoni/i }));
    await user.click(within(toppingsSelector).getByRole('button', { name: /mushrooms/i }));

    // $9.99 + $2.00 + $1.50 = $13.49
    await waitFor(() => {
      expect(within(pricePreview).getByText(/\$13\.49/)).toBeInTheDocument();
    });
  });

  it('should calculate correct price with size change and toppings', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const sizeSelector = screen.getByTestId('size-selector');
    const toppingsSelector = screen.getByTestId('toppings-selector');
    const pricePreview = screen.getByTestId('price-preview');

    // Select large ($9.99 * 1.3 = $12.99) + pepperoni ($2.00)
    await user.click(within(sizeSelector).getByRole('button', { name: 'Large', exact: true }));
    await user.click(within(toppingsSelector).getByRole('button', { name: /pepperoni/i }));

    // $12.99 + $2.00 = $14.99
    await waitFor(() => {
      expect(within(pricePreview).getByText(/\$14\.99/)).toBeInTheDocument();
    });
  });

  // --- Add to Cart ---

  it('should call addItem with correct parameters when clicking add to cart', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const addButton = screen.getByTestId('add-to-cart-builder');
    await user.click(addButton);

    // Default: custom pizza, medium, with tomato-sauce selected
    expect(mockAddItem).toHaveBeenCalledWith(
      'custom',
      'medium',
      expect.arrayContaining(['tomato-sauce'])
    );
  });

  it('should call addItem with selected toppings', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const toppingsSelector = screen.getByTestId('toppings-selector');
    await user.click(within(toppingsSelector).getByRole('button', { name: /pepperoni/i }));
    await user.click(within(toppingsSelector).getByRole('button', { name: /mushrooms/i }));

    const addButton = screen.getByTestId('add-to-cart-builder');
    await user.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith(
      'custom',
      'medium',
      expect.arrayContaining(['tomato-sauce', 'pepperoni', 'mushroom'])
    );
  });

  it('should call addItem with correct size when changed', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const sizeSelector = screen.getByTestId('size-selector');
    await user.click(within(sizeSelector).getByRole('button', { name: 'Large', exact: true }));

    const addButton = screen.getByTestId('add-to-cart-builder');
    await user.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith(
      'custom',
      'large',
      expect.arrayContaining(['tomato-sauce'])
    );
  });

  it('should show "Added!" confirmation after clicking add to cart', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const addButton = screen.getByTestId('add-to-cart-builder');
    await user.click(addButton);

    expect(screen.getByText('Added!')).toBeInTheDocument();
  });

  it('should disable add button while showing confirmation', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const addButton = screen.getByTestId('add-to-cart-builder');
    await user.click(addButton);

    expect(addButton).toBeDisabled();
  });

  // --- Negative / Edge Cases ---

  it('should show base price with no toppings selected (just sauce)', () => {
    renderBuilder();

    const pricePreview = screen.getByTestId('price-preview');
    // Medium base: $9.99, sauce is free
    expect(within(pricePreview).getByText(/\$9\.99/)).toBeInTheDocument();
  });

  it('should include sauce in addItem but not charge for it', async () => {
    const user = userEvent.setup();
    renderBuilder();

    // Switch to BBQ sauce (also $0)
    const sauceSelector = screen.getByTestId('sauce-selector');
    await user.click(within(sauceSelector).getByRole('button', { name: /bbq sauce/i }));

    const pricePreview = screen.getByTestId('price-preview');
    // Price should still be base only ($9.99)
    expect(within(pricePreview).getByText(/\$9\.99/)).toBeInTheDocument();

    const addButton = screen.getByTestId('add-to-cart-builder');
    await user.click(addButton);

    expect(mockAddItem).toHaveBeenCalledWith(
      'custom',
      'medium',
      expect.arrayContaining(['bbq-sauce'])
    );
    // Should NOT include tomato-sauce anymore
    expect(mockAddItem).toHaveBeenCalledWith(
      'custom',
      'medium',
      expect.not.arrayContaining(['tomato-sauce'])
    );
  });

  it('should allow selecting mozzarella (free cheese) without changing price', async () => {
    const user = userEvent.setup();
    renderBuilder();

    const toppingsSelector = screen.getByTestId('toppings-selector');
    await user.click(within(toppingsSelector).getByRole('button', { name: /mozzarella/i }));

    const pricePreview = screen.getByTestId('price-preview');
    // Free topping — price stays at base $9.99
    expect(within(pricePreview).getByText(/\$9\.99/)).toBeInTheDocument();
  });
});
