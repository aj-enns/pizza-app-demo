import { render, screen, waitFor } from '@testing-library/react';
import OrderConfirmationPage from '../page';
import { useSearchParams } from 'next/navigation';
import type { Order } from '@/lib/types';

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

global.fetch = jest.fn();

const mockOrder: Order = {
  id: 'order-1',
  orderNumber: 'PZ-12345',
  customerInfo: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-0100',
    address: '1 Test St',
    city: 'Testville',
    zipCode: '00000',
  },
  items: [
    {
      id: 'item-1',
      pizzaId: 'margherita',
      pizzaName: 'Margherita',
      size: 'medium',
      basePrice: 12.99,
      selectedToppings: ['mozzarella'],
      quantity: 2,
      totalPrice: 12.99,
    },
  ],
  subtotal: 25.98,
  tax: 2.08,
  deliveryFee: 4.99,
  total: 33.05,
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function setSearchParams(params: Record<string, string>) {
  (useSearchParams as jest.Mock).mockReturnValue({
    get: (key: string) => params[key] ?? null,
  });
}

describe('Order Confirmation Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('should show loading indicator while fetching the order', async () => {
    setSearchParams({ orderId: 'order-1' });
    let resolveFetch: (value: unknown) => void = () => {};
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => { resolveFetch = resolve; })
    );

    render(<OrderConfirmationPage />);

    expect(screen.getByText(/loading order details/i)).toBeInTheDocument();

    resolveFetch({ json: async () => ({ success: true, data: mockOrder }) });
    await waitFor(() => {
      expect(screen.queryByText(/loading order details/i)).not.toBeInTheDocument();
    });
  });

  it('should display order details when fetch succeeds', async () => {
    setSearchParams({ orderId: 'order-1' });
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: mockOrder }),
    });

    render(<OrderConfirmationPage />);

    await waitFor(() => {
      expect(screen.getByText('PZ-12345')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/orders/order-1');
    expect(screen.getByRole('heading', { name: /order confirmed/i })).toBeInTheDocument();
    expect(screen.getByText('Margherita')).toBeInTheDocument();
    expect(screen.getByText(/1 test st/i)).toBeInTheDocument();
    expect(screen.getByText(/testville, 00000/i)).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('should render computed totals from the order', async () => {
    setSearchParams({ orderId: 'order-1' });
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: mockOrder }),
    });

    render(<OrderConfirmationPage />);

    // $25.98 appears twice (line item total = qty * unit price, and subtotal)
    await waitFor(() => {
      expect(screen.getAllByText('$25.98').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText('$2.08')).toBeInTheDocument();
    expect(screen.getByText('$4.99')).toBeInTheDocument();
    expect(screen.getByText('$33.05')).toBeInTheDocument();
  });

  it('should show "Order not found" when API returns success=false', async () => {
    setSearchParams({ orderId: 'missing' });
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: false, error: 'Order not found' }),
    });

    render(<OrderConfirmationPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /order not found/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /back to menu/i })).toHaveAttribute('href', '/menu');
  });

  it('should show "Order not found" when fetch throws', async () => {
    setSearchParams({ orderId: 'broken' });
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network'));

    render(<OrderConfirmationPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /order not found/i })).toBeInTheDocument();
    });
  });

  it('should not call fetch when no orderId is in the URL', async () => {
    setSearchParams({});

    render(<OrderConfirmationPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /order not found/i })).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
