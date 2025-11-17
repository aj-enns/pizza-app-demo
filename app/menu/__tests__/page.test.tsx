import { render, screen } from '@testing-library/react';
import MenuPage from '../page';

// Mock PizzaCard component
jest.mock('@/components/PizzaCard', () => {
  return function MockPizzaCard({ pizza }: any) {
    return <div data-testid="pizza-card">{pizza.name}</div>;
  };
});

describe('Menu Page', () => {
  it('should render the page heading', () => {
    render(<MenuPage />);
    expect(screen.getByText('Our Menu')).toBeInTheDocument();
  });

  it('should render the page description', () => {
    render(<MenuPage />);
    expect(screen.getByText(/Discover our handcrafted pizzas/i)).toBeInTheDocument();
  });

  it('should render pizza cards', () => {
    render(<MenuPage />);
    const pizzaCards = screen.getAllByTestId('pizza-card');
    expect(pizzaCards.length).toBeGreaterThan(0);
  });

  it('should render all available pizzas', () => {
    render(<MenuPage />);
    // Should render at least a few pizzas from menu data
    const pizzaCards = screen.getAllByTestId('pizza-card');
    expect(pizzaCards.length).toBeGreaterThanOrEqual(3);
  });

  it('should render pizzas in a grid layout', () => {
    const { container } = render(<MenuPage />);
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });
});
