import { render, screen } from '@testing-library/react';
import CartSummary from '../CartSummary';
import { CartProvider } from '@/contexts/CartContext';
import { useCart } from '@/contexts/CartContext';

// Mock the useCart hook
jest.mock('@/contexts/CartContext', () => ({
  ...jest.requireActual('@/contexts/CartContext'),
  useCart: jest.fn(),
}));

describe('CartSummary', () => {
  const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;

  beforeEach(() => {
    mockUseCart.mockReturnValue({
      items: [],
      itemCount: 0,
      subtotal: 0,
      tax: 0,
      deliveryFee: 0,
      total: 0,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
    });
  });

  it('should render the order summary heading', () => {
    render(<CartSummary />);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('should display subtotal', () => {
    render(<CartSummary />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
  });

  it('should display tax', () => {
    render(<CartSummary />);
    expect(screen.getByText('Tax (8%)')).toBeInTheDocument();
  });

  it('should display delivery fee', () => {
    render(<CartSummary />);
    expect(screen.getByText('Delivery Fee')).toBeInTheDocument();
  });

  it('should display total', () => {
    render(<CartSummary />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should format prices correctly with zero values', () => {
    render(<CartSummary />);
    const priceElements = screen.getAllByText('$0.00');
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('should display correct values when cart has items', () => {
    mockUseCart.mockReturnValue({
      items: [],
      itemCount: 2,
      subtotal: 25.00,
      tax: 2.00,
      deliveryFee: 4.99,
      total: 31.99,
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
    });

    render(<CartSummary />);
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    expect(screen.getByText('$2.00')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
    expect(screen.getByText('$31.99')).toBeInTheDocument();
  });

  it('should display delivery time estimate', () => {
    render(<CartSummary />);
    expect(screen.getByText(/30-45 minutes/i)).toBeInTheDocument();
  });

  it('should have sticky positioning', () => {
    const { container } = render(<CartSummary />);
    const summaryDiv = container.querySelector('.sticky');
    expect(summaryDiv).toBeInTheDocument();
  });
});
