import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  it('should render the brand name', () => {
    render(<Footer />);
    expect(screen.getByText('PizzaHub')).toBeInTheDocument();
  });

  it('should render the tagline', () => {
    render(<Footer />);
    expect(screen.getByText(/Serving the best pizzas in town/i)).toBeInTheDocument();
  });

  it('should render Quick Links section', () => {
    render(<Footer />);
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Cart')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    // Contact appears twice (link and heading), so use getAllByText
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
  });

  it('should render Contact section', () => {
    render(<Footer />);
    // Contact appears as both link and heading
    expect(screen.getAllByText('Contact').length).toBe(2);
    expect(screen.getByText(/555.*123-4567/i)).toBeInTheDocument();
    expect(screen.getByText(/info@pizzahub.com/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Pizza Street/i)).toBeInTheDocument();
  });

  it('should display current year in copyright', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}.*PizzaHub`))).toBeInTheDocument();
  });

  it('should render business hours', () => {
    render(<Footer />);
    expect(screen.getByText(/Mon-Sun: 11AM - 10PM/i)).toBeInTheDocument();
  });

  it('should have correct link hrefs', () => {
    render(<Footer />);
    const menuLink = screen.getByRole('link', { name: /menu/i });
    const cartLink = screen.getByRole('link', { name: /cart/i });
    
    expect(menuLink).toHaveAttribute('href', '/menu');
    expect(cartLink).toHaveAttribute('href', '/cart');
  });
});
