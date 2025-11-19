import { render, screen } from '@testing-library/react';
import Header from '../Header';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Helper to render with CartProvider and ThemeProvider
const renderWithCart = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <CartProvider>{ui}</CartProvider>
    </ThemeProvider>
  );
};

describe('Header', () => {
  it('should render the logo and brand name', () => {
    renderWithCart(<Header />);
    expect(screen.getByText('PizzaHub')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    renderWithCart(<Header />);
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('should render cart link', () => {
    renderWithCart(<Header />);
    // Cart link has no accessible name (icon only), so find by href
    const cartLinks = screen.getAllByRole('link');
    const cartLink = cartLinks.find(link => link.getAttribute('href') === '/cart');
    expect(cartLink).toBeInTheDocument();
  });

  it('should not show cart badge when cart is empty', () => {
    renderWithCart(<Header />);
    const badge = screen.queryByText(/^\d+$/);
    expect(badge).not.toBeInTheDocument();
  });

  it('should have correct links', () => {
    renderWithCart(<Header />);
    const homeLink = screen.getByRole('link', { name: /pizzahub/i });
    const menuLink = screen.getByRole('link', { name: /menu/i });
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(menuLink).toHaveAttribute('href', '/menu');
  });

  it('should apply sticky positioning', () => {
    const { container } = renderWithCart(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky');
  });
});
