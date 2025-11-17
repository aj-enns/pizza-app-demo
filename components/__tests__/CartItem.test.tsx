import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartItem from '../CartItem';
import { CartProvider } from '@/contexts/CartContext';
import { CartItem as CartItemType } from '@/lib/types';

const mockCartItem: CartItemType = {
  id: '1',
  pizzaId: 'margherita',
  pizzaName: 'Margherita',
  size: 'medium',
  basePrice: 10.99,
  selectedToppings: ['mozzarella', 'tomato-sauce'],
  quantity: 2,
  totalPrice: 10.99,
};

const mockCartItemWithExtras: CartItemType = {
  id: '2',
  pizzaId: 'pepperoni',
  pizzaName: 'Pepperoni',
  size: 'large',
  basePrice: 12.99,
  selectedToppings: ['mozzarella', 'pepperoni', 'mushrooms'],
  quantity: 1,
  totalPrice: 14.99,
};

const renderWithCart = (ui: React.ReactElement) => {
  return render(<CartProvider>{ui}</CartProvider>);
};

describe('CartItem', () => {
  it('should render pizza name', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    expect(screen.getByText('Margherita')).toBeInTheDocument();
  });

  it('should render size label', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    expect(screen.getByText(/Medium \(12"\)/)).toBeInTheDocument();
  });

  it('should render quantity', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render total price for quantity', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    // 10.99 * 2 = 21.98
    expect(screen.getByText('$21.98')).toBeInTheDocument();
  });

  it('should render price per item', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    expect(screen.getByText('$10.99 each')).toBeInTheDocument();
  });

  it('should render remove button', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    const removeButton = screen.getByRole('button', { name: /remove item/i });
    expect(removeButton).toBeInTheDocument();
  });

  it('should render increase quantity button', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
    expect(increaseButton).toBeInTheDocument();
  });

  it('should render decrease quantity button', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
    expect(decreaseButton).toBeInTheDocument();
  });

  it('should not show extra toppings when all toppings are free', () => {
    renderWithCart(<CartItem item={mockCartItem} />);
    // Extra toppings only show if they have price > 0
    expect(screen.queryByText(/Extra:/)).not.toBeInTheDocument();
  });

  it('should show extra toppings label when item has extras', () => {
    renderWithCart(<CartItem item={mockCartItemWithExtras} />);
    expect(screen.getByText(/Extra:/)).toBeInTheDocument();
  });

  it('should handle quantity increase click', async () => {
    const user = userEvent.setup();
    renderWithCart(<CartItem item={mockCartItem} />);
    
    const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
    await user.click(increaseButton);
    
    // Button should be clickable (not throw error)
    expect(increaseButton).toBeInTheDocument();
  });

  it('should handle quantity decrease click', async () => {
    const user = userEvent.setup();
    renderWithCart(<CartItem item={mockCartItem} />);
    
    const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
    await user.click(decreaseButton);
    
    // Button should be clickable (not throw error)
    expect(decreaseButton).toBeInTheDocument();
  });

  it('should handle remove click', async () => {
    const user = userEvent.setup();
    renderWithCart(<CartItem item={mockCartItem} />);
    
    const removeButton = screen.getByRole('button', { name: /remove item/i });
    await user.click(removeButton);
    
    // Button should be clickable (not throw error)
    expect(removeButton).toBeInTheDocument();
  });
});
