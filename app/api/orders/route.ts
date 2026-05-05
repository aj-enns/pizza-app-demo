/**
 * @file app/api/orders/route.ts
 * @description API Route handler for Pizza Orders. 
 * Handles order creation (POST) with strict validation, secure server-side price 
 * recalculation, and file-based persistence. Also provides a basic health check (GET).
 */
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Order, CustomerInfo, CartItem } from '@/lib/types';
import { generateOrderNumber, calculateCartTotals, getPizzaById, calculateItemPrice } from '@/lib/utils';
import { trackPerformance, trackPerformanceSync, PERFORMANCE_THRESHOLDS } from '@/lib/performance';
import { z } from 'zod';

const DATA_DIR = path.join(process.cwd(), 'data', 'orders');
const MAX_ITEMS = 50; // Prevent cart spam denial-of-service
const MAX_STRING_LENGTH = 500; // Prevent excessively long inputs that consume memory

// Global state to ensure the data directory is only checked/created once per server lifecycle
let dirInitialized = false;

/**
 * Ensures that the local directory for storing JSON orders exists.
 * Creates the directory recursively if it doesn't.
 */
async function ensureDataDir() {
  if (!dirInitialized) {
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
    dirInitialized = true;
  }
}

/**
 * Zod schema for strict validation of customer checkout information.
 * Enforces types, required fields, formatting (email/phone), and maximum lengths.
 */
const customerInfoSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(MAX_STRING_LENGTH, 'Input fields are too long'),
  email: z.string().trim().email('Invalid email format').toLowerCase().max(MAX_STRING_LENGTH, 'Input fields are too long'),
  phone: z.string().trim().regex(/^[\d\s\-\(\)\+]+$/, 'Invalid phone format').max(MAX_STRING_LENGTH, 'Input fields are too long'),
  address: z.string().trim().min(1, 'All required fields must be filled').max(MAX_STRING_LENGTH, 'Input fields are too long'),
  city: z.string().trim().min(1, 'All required fields must be filled').max(MAX_STRING_LENGTH, 'Input fields are too long'),
  zipCode: z.string().trim().min(1, 'All required fields must be filled').max(MAX_STRING_LENGTH, 'Input fields are too long'),
  deliveryInstructions: z.string().trim().max(MAX_STRING_LENGTH, 'Input fields are too long').optional().nullable().transform(v => v || undefined),
});

/**
 * Validates and sanitizes incoming customer information using Zod.
 * Also performs basic XSS sanitization (stripping `<` and `>`).
 * 
 * @param info - The raw, untrusted customer object from the request body
 * @returns An object indicating validity, an error message (if invalid), and the sanitized data
 */
function validateCustomerInfo(info: any): { valid: boolean; error?: string; sanitized?: CustomerInfo } {
  try {
    // 1 & 2 & 3: Strict typing, comprehensive length checks, and Zod library
    const parsed = customerInfoSchema.parse(info);

    // Basic XSS sanitization helper to strip HTML tags
    const sanitize = (str: string) => str.replace(/[<>]/g, '');

    return {
      valid: true,
      sanitized: {
        name: sanitize(parsed.name),
        email: sanitize(parsed.email),
        phone: sanitize(parsed.phone),
        address: sanitize(parsed.address),
        city: sanitize(parsed.city),
        zipCode: sanitize(parsed.zipCode),
        deliveryInstructions: parsed.deliveryInstructions ? sanitize(parsed.deliveryInstructions) : undefined,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Invalid customer info' };
    }
    return { valid: false, error: 'Customer information is required' };
  }
}

/**
 * Validates cart items and recalculates prices on the server.
 * SECURITY: Never trust client-provided pricing data. This method looks up base
 * prices from the server and recalculates exact totals to prevent tampering.
 * 
 * @param items - The array of cart items from the request payload
 * @returns Validation status, error string, and deeply verified/recalculated CartItem array
 */
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

    // Validate required fields and reasonable quantities
    if (!pizzaId || !size || !quantity || quantity < 1 || quantity > 20) {
      return { valid: false, error: 'Invalid cart item data' };
    }

    // Verify pizza actually exists in our menu database
    const pizza = getPizzaById(pizzaId);
    if (!pizza) {
      return { valid: false, error: `Pizza ${pizzaId} not found in menu` };
    }

    // Verify the requested size exists for this specific pizza type
    const sizeConfig = pizza.sizes.find(s => s.size === size);
    if (!sizeConfig) {
      return { valid: false, error: `Invalid size ${size} for pizza ${pizzaId}` };
    }

    // Securely recalculate the total price using our trusted server-side menu data
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
      quantity: Math.floor(quantity), // Guard against fractional quantities
      totalPrice: Number(totalPrice.toFixed(2)),
    });
  }

  return { valid: true, recalculated };
}

/**
 * Handles POST requests to create a new pizza order.
 * Expects a JSON payload containing `customerInfo` and `items`.
 */
export async function POST(request: NextRequest) {
  return trackPerformance(
    'API:POST:/api/orders',
    async () => {
      try {
        // Parse request body
        const body = await request.json();

        // 1. Validate customer information
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

    // 2. Validate and reliably recalculate cart item prices
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

    // 3. Recalculate final totals server-side (taxes, fees, subtotal)
    const totals = calculateCartTotals(items);

    // 4. Construct final order object natively
    const order: Order = {
      id: `order-${randomUUID()}`,
      orderNumber: generateOrderNumber(),
      customerInfo,
      items,
      ...totals,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // 5. Ensure storage directory exists
    await ensureDataDir();

    // 6. Write final order to file system identically wrapped in performance trackers
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
    // Log error securely (avoid exposing sensitive details to the client)
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

/**
 * Handles GET requests to check order API availability.
 * Current implementation serves as a basic health-check endpoint.
 */
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
