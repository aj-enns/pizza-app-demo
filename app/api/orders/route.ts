import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Order, CustomerInfo, CartItem } from '@/lib/types';
import { generateOrderNumber, calculateCartTotals, getPizzaById, calculateItemPrice } from '@/lib/utils';
import { trackPerformance, trackPerformanceSync, PERFORMANCE_THRESHOLDS } from '@/lib/performance';

const DATA_DIR = path.join(process.cwd(), 'data', 'orders');
const MAX_ITEMS = 50; // Prevent cart spam
const MAX_STRING_LENGTH = 500; // Prevent excessively long inputs

// Ensure data directory exists (initialized once)
let dirInitialized = false;
async function ensureDataDir() {
  if (!dirInitialized) {
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
    dirInitialized = true;
  }
}

// Validate and sanitize customer info
function validateCustomerInfo(info: any): { valid: boolean; error?: string; sanitized?: CustomerInfo } {
  if (!info || typeof info !== 'object') {
    return { valid: false, error: 'Customer information is required' };
  }

  const { name, email, phone, address, city, zipCode, deliveryInstructions } = info;

  // Required fields
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !city?.trim() || !zipCode?.trim()) {
    return { valid: false, error: 'All required fields must be filled' };
  }

  // Length validation
  if (name.length > MAX_STRING_LENGTH || address.length > MAX_STRING_LENGTH) {
    return { valid: false, error: 'Input fields are too long' };
  }

  // Email format validation (basic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Phone format validation (basic - allows various formats)
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Invalid phone format' };
  }

  // Sanitize strings (remove potential XSS)
  const sanitize = (str: string) => str.trim().replace(/[<>]/g, '');

  return {
    valid: true,
    sanitized: {
      name: sanitize(name),
      email: sanitize(email.toLowerCase()),
      phone: sanitize(phone),
      address: sanitize(address),
      city: sanitize(city),
      zipCode: sanitize(zipCode),
      deliveryInstructions: deliveryInstructions ? sanitize(deliveryInstructions).substring(0, MAX_STRING_LENGTH) : undefined,
    },
  };
}

// Validate and recalculate cart items server-side (NEVER trust client prices!)
function validateAndRecalculateItems(items: any[]): { valid: boolean; error?: string; recalculated?: CartItem[] } {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: 'Cart is empty' };
  }

  if (items.length > MAX_ITEMS) {
    return { valid: false, error: `Maximum ${MAX_ITEMS} items allowed per order` };
  }

  const recalculated: CartItem[] = [];

  for (const item of items) {
    const { pizzaId, size, selectedToppings = [], quantity } = item;

    // Validate required fields
    if (!pizzaId || !size || !quantity || quantity < 1 || quantity > 20) {
      return { valid: false, error: 'Invalid cart item data' };
    }

    // Verify pizza exists in menu
    const pizza = getPizzaById(pizzaId);
    if (!pizza) {
      return { valid: false, error: `Pizza ${pizzaId} not found in menu` };
    }

    // Verify size exists for this pizza
    const sizeConfig = pizza.sizes.find(s => s.size === size);
    if (!sizeConfig) {
      return { valid: false, error: `Invalid size ${size} for pizza ${pizzaId}` };
    }

    // Recalculate price server-side (security critical!)
    const totalPrice = calculateItemPrice(
      pizza.basePrice,
      size,
      sizeConfig.priceMultiplier,
      selectedToppings,
      pizza.defaultToppings
    );

    recalculated.push({
      id: randomUUID(),
      pizzaId,
      pizzaName: pizza.name,
      size,
      basePrice: pizza.basePrice,
      selectedToppings,
      quantity: Math.floor(quantity),
      totalPrice: Number(totalPrice.toFixed(2)),
    });
  }

  return { valid: true, recalculated };
}

export async function POST(request: NextRequest) {
  return trackPerformance(
    'API:POST:/api/orders',
    async () => {
      try {
        // Parse request body with size limit check
        const body = await request.json();

        // Validate customer info
        const customerValidation = trackPerformanceSync(
          'validateCustomerInfo',
          () => validateCustomerInfo(body.customerInfo),
          PERFORMANCE_THRESHOLDS.CALCULATION,
          { endpoint: '/api/orders' }
        );
    if (!customerValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: customerValidation.error,
        },
        { status: 400 }
      );
    }

    // Validate and recalculate cart items (never trust client prices!)
    const itemsValidation = trackPerformanceSync(
      'validateAndRecalculateItems',
      () => validateAndRecalculateItems(body.items),
      PERFORMANCE_THRESHOLDS.CALCULATION,
      { itemCount: body.items?.length || 0 }
    );
    if (!itemsValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: itemsValidation.error,
        },
        { status: 400 }
      );
    }

    const customerInfo = customerValidation.sanitized!;
    const items = itemsValidation.recalculated!;

    // Recalculate totals server-side
    const totals = calculateCartTotals(items);

    // Create order with secure UUID
    const order: Order = {
      id: `order-${randomUUID()}`,
      orderNumber: generateOrderNumber(),
      customerInfo,
      items,
      ...totals,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Ensure directory exists (cached after first call)
    await ensureDataDir();

    // Save order to file
    const orderFilePath = path.join(DATA_DIR, `${order.id}.json`);
    await trackPerformance(
      'writeOrderFile',
      async () => writeFile(orderFilePath, JSON.stringify(order, null, 2), { encoding: 'utf-8' }),
      PERFORMANCE_THRESHOLDS.FILE_OPERATION,
      { orderId: order.id }
    );

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    // Log error securely (avoid exposing sensitive details)
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
        },
        { status: 400 }
      );
    }

    console.error('Order creation error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
      },
      { status: 500 }
    );
      }
    },
    PERFORMANCE_THRESHOLDS.API_REQUEST,
    { endpoint: '/api/orders', method: 'POST' }
  );
}

export async function GET() {
  return trackPerformance(
    'API:GET:/api/orders',
    async () => {
      try {
        await ensureDataDir();
    
    return NextResponse.json({
      success: true,
      message: 'Orders API is running',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to access orders',
      },
      { status: 500 }
    );
      }
    },
    PERFORMANCE_THRESHOLDS.API_REQUEST,
    { endpoint: '/api/orders', method: 'GET' }
  );
}
