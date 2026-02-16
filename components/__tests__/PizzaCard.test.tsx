import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PizzaCard from '../PizzaCard';
import { CartProvider } from '@/contexts/CartContext';
import { Pizza } from '@/lib/types';

const mockPizza: Pizza = {
  id: 'margherita',
  name: 'Margherita',
  description: 'Classic pizza with fresh mozzarella and basil',
  category: 'classic',
  imageUrl: 'https://example.com/pizza.jpg',
  basePrice: 10.99,
  sizes: [
    { size: 'small', priceMultiplier: 0.8 },
    { size: 'medium', priceMultiplier: 1.0 },
    { size: 'large', priceMultiplier: 1.3 },
    { size: 'xlarge', priceMultiplier: 1.5 },
  ],
  defaultToppings: ['mozzarella', 'tomato-sauce', 'basil'],
};

const renderWithCart = (ui: React.ReactElement) => {
  return render(<CartProvider>{ui}</CartProvider>);
};

describe('PizzaCard', () => {
  it('should render pizza name and description', () => {
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    expect(screen.getByText('Margherita')).toBeInTheDocument();
    expect(screen.getByText(/Classic pizza with fresh mozzarella/)).toBeInTheDocument();
  });

  it('should render pizza category', () => {
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    expect(screen.getByText('classic')).toBeInTheDocument();
  });

  it('should render all available sizes', () => {
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Large')).toBeInTheDocument();
    expect(screen.getByText('X-Large')).toBeInTheDocument();
  });

  it('should have medium size selected by default', () => {
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    const mediumButton = screen.getByText('Medium');
    expect(mediumButton).toHaveClass('border-primary-600');
  });

  it('should change selected size when clicked', async () => {
    const user = userEvent.setup();
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    
    const largeButton = screen.getByText('Large');
    await user.click(largeButton);
    
    expect(largeButton).toHaveClass('border-primary-600');
  });

  it('should render "Add to Cart" button', () => {
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
  });

  it('should show "Added!" message after adding to cart', async () => {
    const user = userEvent.setup();
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);
    
    expect(screen.getByText('Added!')).toBeInTheDocument();
  });

  it('should display price', () => {
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    // Should display medium price (base price * 1.0)
    expect(screen.getByText(/\$10\.99/)).toBeInTheDocument();
  });

  it('should update price when size changes', async () => {
    const user = userEvent.setup();
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    
    const largeButton = screen.getByText('Large');
    await user.click(largeButton);
    
    // Large price should be base price * 1.3 = 14.29
    await waitFor(() => {
      expect(screen.getByText(/\$14\.29/)).toBeInTheDocument();
    });
  });

  it('should render pizza image', () => {
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    const image = screen.getByAltText('Margherita');
    expect(image).toBeInTheDocument();
  });

  it('should disable button while adding', async () => {
    const user = userEvent.setup();
    renderWithCart(<PizzaCard pizza={mockPizza} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await user.click(addButton);
    
    expect(addButton).toBeDisabled();
  });
});
