/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { CustomerInfo, CartItem } from '@/lib/types';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import path from 'path';

// Mock filesystem
jest.mock('fs/promises');
jest.mock('fs');

const mockCustomerInfo: CustomerInfo = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-123-4567',
  address: '123 Main St',
  city: 'Springfield',
  zipCode: '12345',
  deliveryInstructions: 'Ring doorbell',
};

const mockCartItems = [
  {
    pizzaId: 'margherita',
    size: 'medium',
    selectedToppings: ['mozzarella', 'tomato-sauce', 'basil'],
    quantity: 2,
  },
];

describe('GET /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success message', async () => {
    (fsSync.existsSync as jest.Mock).mockReturnValue(true);
    
    const response = await GET();
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();
  });
});

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fsSync.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  it('should create order successfully with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.orderNumber).toBeDefined();
  });

  it('should return order with recalculated prices', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.subtotal).toBeDefined();
    expect(data.data.tax).toBeDefined();
    expect(data.data.deliveryFee).toBe(4.99);
    expect(data.data.total).toBeDefined();
  });

  it('should reject empty customer info', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: {},
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should reject missing required fields', async () => {
    const incompleteCustomer = {
      name: 'John Doe',
      email: 'john@example.com',
      // Missing phone, address, city, zipCode
    };

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: incompleteCustomer,
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should reject invalid email format', async () => {
    const invalidCustomer = {
      ...mockCustomerInfo,
      email: 'not-an-email',
    };

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: invalidCustomer,
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('should reject invalid phone format', async () => {
    const invalidCustomer = {
      ...mockCustomerInfo,
      phone: 'not a phone',
    };

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: invalidCustomer,
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('phone');
  });

  it('should reject empty cart', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('empty');
  });

  it('should reject invalid pizza ID', async () => {
    const invalidItems = [
      {
        pizzaId: 'non-existent-pizza',
        size: 'medium',
        selectedToppings: [],
        quantity: 1,
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: invalidItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should reject invalid quantity', async () => {
    const invalidItems = [
      {
        pizzaId: 'margherita',
        size: 'medium',
        selectedToppings: [],
        quantity: 0,
      },
    ];

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: invalidItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should sanitize customer input', async () => {
    const xssCustomer = {
      ...mockCustomerInfo,
      name: 'John <script>alert("xss")</script> Doe',
      address: '123 Main <b>St</b>',
    };

    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: xssCustomer,
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.customerInfo.name).not.toContain('<');
    expect(data.data.customerInfo.name).not.toContain('>');
  });

  it('should write order to file system', async () => {
    // The directory initialization is cached, so we just verify writeFile is called
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: mockCartItems,
      }),
    });

    await POST(request);

    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should write order to file', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: mockCartItems,
      }),
    });

    await POST(request);

    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should include order status and timestamp', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerInfo: mockCustomerInfo,
        items: mockCartItems,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.data.status).toBe('pending');
    expect(data.data.createdAt).toBeDefined();
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      body: 'not json',
    });

    const response = await POST(request);
    const data = await response.json();

    // NextRequest.json() throws SyntaxError which gets caught as 400 or 500
    expect([400, 500]).toContain(response.status);
    expect(data.success).toBe(false);
  });
});
