import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from '../page';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/lib/types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('@/components/CartSummary', () => {
  return function MockCartSummary() {
    return <div data-testid="cart-summary">Cart Summary</div>;
  };
});

global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
};

const sampleItem: CartItem = {
  id: 'item-1',
  pizzaId: 'margherita',
  pizzaName: 'Margherita',
  size: 'medium',
  basePrice: 12.99,
  selectedToppings: ['mozzarella', 'tomato-sauce', 'basil'],
  quantity: 1,
  totalPrice: 12.99,
};

const mockClearCart = jest.fn();

function setupCart(items: CartItem[]) {
  (useCart as jest.Mock).mockReturnValue({
    items,
    clearCart: mockClearCart,
    addItem: jest.fn(),
    addCustomItem: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
    subtotal: 0,
    tax: 0,
    deliveryFee: 0,
    total: 0,
    itemCount: items.length,
  });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), 'John Doe');
  await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
  await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
  await user.type(screen.getByLabelText(/street address/i), '123 Main St');
  await user.type(screen.getByLabelText(/city/i), 'Springfield');
  await user.type(screen.getByLabelText(/zip code/i), '12345');
}

describe('Checkout Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Empty cart redirect', () => {
    it('should redirect to /cart when cart is empty', () => {
      setupCart([]);
      render(<CheckoutPage />);
      expect(mockRouter.push).toHaveBeenCalledWith('/cart');
    });
  });

  describe('Form rendering with items', () => {
    beforeEach(() => {
      setupCart([sampleItem]);
    });

    it('should render the checkout heading', () => {
      render(<CheckoutPage />);
      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    });

    it('should render all required form fields', () => {
      render(<CheckoutPage />);
      expect(screen.getByLabelText(/full name/i)).toBeRequired();
      expect(screen.getByLabelText(/phone number/i)).toBeRequired();
      expect(screen.getByLabelText(/email address/i)).toBeRequired();
      expect(screen.getByLabelText(/street address/i)).toBeRequired();
      expect(screen.getByLabelText(/city/i)).toBeRequired();
      expect(screen.getByLabelText(/zip code/i)).toBeRequired();
    });

    it('should render delivery instructions as optional', () => {
      render(<CheckoutPage />);
      expect(screen.getByLabelText(/delivery instructions/i)).not.toBeRequired();
    });

    it('should render the cart summary sidebar', () => {
      render(<CheckoutPage />);
      expect(screen.getByTestId('cart-summary')).toBeInTheDocument();
    });

    it('should render the place order button', () => {
      render(<CheckoutPage />);
      expect(screen.getByRole('button', { name: /place order/i })).toBeEnabled();
    });

    it('should not redirect when cart has items', () => {
      render(<CheckoutPage />);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Form input handling', () => {
    beforeEach(() => {
      setupCart([sampleItem]);
    });

    it('should update field values as user types', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);

      const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement;
      await user.type(nameInput, 'Jane Smith');
      expect(nameInput.value).toBe('Jane Smith');
    });
  });

  describe('Successful submission', () => {
    beforeEach(() => {
      setupCart([sampleItem]);
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          data: { id: 'order-abc-123', orderNumber: 'PZ-99999' },
        }),
      });
    });

    it('should POST order to /api/orders with form data and cart items', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);

      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/orders',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.customerInfo.name).toBe('John Doe');
      expect(body.customerInfo.email).toBe('john@example.com');
      expect(body.items).toEqual([sampleItem]);
    });

    it('should clear cart and redirect to confirmation on success', async () => {
      const user = userEvent.setup();
      render(<CheckoutPage />);

      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(mockClearCart).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/order-confirmation?orderId=order-abc-123'
        );
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      setupCart([sampleItem]);
    });

    it('should display server-provided error message when API returns success=false', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: false, error: 'Invalid email format' }),
      });

      const user = userEvent.setup();
      render(<CheckoutPage />);

      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should display fallback error message when API returns no error text', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ success: false }),
      });

      const user = userEvent.setup();
      render(<CheckoutPage />);

      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to place order/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message when fetch throws', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

      const user = userEvent.setup();
      render(<CheckoutPage />);

      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('Loading state', () => {
    beforeEach(() => {
      setupCart([sampleItem]);
    });

    it('should disable button and show processing text while submitting', async () => {
      let resolveFetch: (value: unknown) => void = () => {};
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise(resolve => {
            resolveFetch = resolve;
          })
      );

      const user = userEvent.setup();
      render(<CheckoutPage />);

      await fillRequiredFields(user);
      await user.click(screen.getByRole('button', { name: /place order/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
      });

      resolveFetch({
        json: async () => ({ success: true, data: { id: 'x' } }),
      });
    });
  });
});
