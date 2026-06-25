/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { Order } from '@/lib/types';

jest.mock('fs/promises');
jest.mock('fs');

const mockOrder: Order = {
  id: 'test-order-id-123',
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
      selectedToppings: ['mozzarella', 'tomato-sauce', 'basil'],
      quantity: 1,
      totalPrice: 12.99,
    },
  ],
  subtotal: 12.99,
  tax: 1.04,
  deliveryFee: 4.99,
  total: 19.02,
  status: 'pending',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeRequest(id: string) {
  const request = new NextRequest(`http://localhost:3000/api/orders/${id}`);
  const params = Promise.resolve({ id });
  return { request, ctx: { params } };
}

describe('GET /api/orders/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return order data when order file exists', async () => {
    (fsSync.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockOrder));

    const { request, ctx } = makeRequest(mockOrder.id);
    const response = await GET(request, ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockOrder);
    expect(fs.readFile).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when order file does not exist', async () => {
    (fsSync.existsSync as jest.Mock).mockReturnValue(false);

    const { request, ctx } = makeRequest('missing-order');
    const response = await GET(request, ctx);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Order not found');
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('should return 500 when reading the order file fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fsSync.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('disk error'));

    const { request, ctx } = makeRequest('order-with-fs-error');
    const response = await GET(request, ctx);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to retrieve order');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should return 500 when stored order JSON is malformed', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (fsSync.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFile as jest.Mock).mockResolvedValue('{ this is not valid json');

    const { request, ctx } = makeRequest('order-bad-json');
    const response = await GET(request, ctx);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to retrieve order');
    errorSpy.mockRestore();
  });

  it('should look up the file using the provided id', async () => {
    (fsSync.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockOrder));

    const { request, ctx } = makeRequest('specific-id-abc');
    await GET(request, ctx);

    const calledPath = (fsSync.existsSync as jest.Mock).mock.calls[0][0] as string;
    expect(calledPath).toContain('specific-id-abc.json');
  });
});
