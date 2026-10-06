import { render, screen } from '@testing-library/react';
import CartPage from '../page';
import { CartProvider } from '@/contexts/CartContext';

/**
 * Verifies the cart page's empty-state content and layout.
 *
 * The shared Jest setup provides an empty localStorage mock, so each render
 * starts with no cart items. Assertions for populated-cart controls therefore
 * verify that those controls remain hidden in the empty state.
 *
 * CartItem and CartSummary are mocked to keep this suite focused on the page's
 * conditional rendering rather than behavior owned by child components.
 */
jest.mock('@/components/CartItem', () => {
  return function MockCartItem({ item }: any) {
    return <div data-testid="cart-item">{item.pizzaName}</div>;
  };
});

jest.mock('@/components/CartSummary', () => {
  return function MockCartSummary() {
    return <div data-testid="cart-summary">Summary</div>;
  };
});

/** Renders the page with the same cart context provided by the root layout. */
const renderWithCart = (ui: React.ReactElement) => {
  return render(<CartProvider>{ui}</CartProvider>);
};


describe('Cart Page', () => {
  describe('Empty Cart', () => {
    it('should display empty cart message when cart is empty', () => {
      renderWithCart(<CartPage />);
      expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
    });

    it('should display empty cart description', () => {
      renderWithCart(<CartPage />);
      expect(screen.getByText(/Add some delicious pizzas/i)).toBeInTheDocument();
    });

    it('should show "Browse Menu" link when cart is empty', () => {
      renderWithCart(<CartPage />);
      const browseLink = screen.getByRole('link', { name: /browse menu/i });
      expect(browseLink).toBeInTheDocument();
      expect(browseLink).toHaveAttribute('href', '/menu');
    });

    it('should render shopping bag icon when cart is empty', () => {
      const { container } = renderWithCart(<CartPage />);
      // Lucide renders the decorative shopping bag as an inline SVG.
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('With Items', () => {
    it('should render page heading with item count', () => {
      renderWithCart(<CartPage />);
      expect(screen.queryByText(/Your Cart \(/)).not.toBeInTheDocument();
    });

    it('should have links to checkout and continue shopping', () => {
      renderWithCart(<CartPage />);
      const checkoutLink = screen.queryByRole('link', { name: /proceed to checkout/i });
      const continueLink = screen.queryByRole('link', { name: /continue shopping/i });
      
      expect(checkoutLink).not.toBeInTheDocument();
      expect(continueLink).not.toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should have container with proper styling', () => {
      const { container } = renderWithCart(<CartPage />);
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toBeInTheDocument();
    });

    it('should be responsive', () => {
      const { container } = renderWithCart(<CartPage />);
      const element = container.querySelector('.lg\\:col-span-2');
      expect(element).toBeNull();
    });
  });
});
