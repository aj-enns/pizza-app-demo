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
import { logger } from '@/lib/logger';
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
 * Validates incoming customer information using Zod.
 *
 * Note: No string "sanitization" is performed here. XSS is prevented by
 * contextual output encoding at render time (React/JSX escapes by default).
 * Avoid introducing `dangerouslySetInnerHTML` for these fields; if HTML
 * rendering is ever required, sanitize at the render site with a real
 * sanitizer (e.g., DOMPurify) rather than ad-hoc character stripping.
 *
 * @param info - The raw, untrusted customer object from the request body
 * @returns An object indicating validity, an error message (if invalid), and the validated data
 */
function validateCustomerInfo(info: unknown): { valid: boolean; error?: string; sanitized?: CustomerInfo } {
  try {
    const parsed = customerInfoSchema.parse(info);

    return {
      valid: true,
      sanitized: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        address: parsed.address,
        city: parsed.city,
        zipCode: parsed.zipCode,
        deliveryInstructions: parsed.deliveryInstructions,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message || 'Invalid customer info' };
    }
    return { valid: false, error: 'Customer information is required' };
  }
}

const MAX_TOPPINGS_PER_ITEM = 20;

/**
 * Zod schema for a single incoming cart item. Validates shape, types, and bounds
 * before any menu lookups occur, so malformed payloads are rejected cheaply.
 */
const cartItemInputSchema = z.object({
  pizzaId: z.string().min(1).max(MAX_STRING_LENGTH),
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  selectedToppings: z.array(z.string().min(1).max(MAX_STRING_LENGTH)).max(MAX_TOPPINGS_PER_ITEM).default([]),
  quantity: z.number().int().min(1).max(20),
});

const cartItemsInputSchema = z
  .array(cartItemInputSchema)
  .min(1, 'Cart is empty')
  .max(MAX_ITEMS, `Maximum ${MAX_ITEMS} items allowed per order`);

/**
 * Validates cart items and recalculates prices on the server.
 * SECURITY: Never trust client-provided pricing data. This method looks up base
 * prices from the server and recalculates exact totals to prevent tampering.
 *
 * Performance: pizza records are cached per call so a cart with multiple
 * entries of the same pizza only scans the menu once. Size configs are indexed
 * into a Map for O(1) lookup instead of repeated Array.find calls.
 */
function validateAndRecalculateItems(items: unknown): { valid: boolean; error?: string; recalculated?: CartItem[] } {
  const parsed = cartItemsInputSchema.safeParse(items);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { valid: false, error: issue?.message || 'Invalid cart item data' };
  }

  // Cache pizza + size lookups across items in this request
  const pizzaCache = new Map<string, { pizza: ReturnType<typeof getPizzaById>; sizes: Map<string, number> }>();

  const recalculated: CartItem[] = new Array(parsed.data.length);

  for (let i = 0; i < parsed.data.length; i++) {
    const { pizzaId, size, selectedToppings, quantity } = parsed.data[i];

    let cached = pizzaCache.get(pizzaId);
    if (!cached) {
      const pizza = getPizzaById(pizzaId);
      if (!pizza) {
        return { valid: false, error: `Pizza ${pizzaId} not found in menu` };
      }
      const sizes = new Map(pizza.sizes.map(s => [s.size, s.priceMultiplier]));
      cached = { pizza, sizes };
      pizzaCache.set(pizzaId, cached);
    }

    const { pizza } = cached;
    const priceMultiplier = cached.sizes.get(size);
    if (priceMultiplier === undefined) {
      return { valid: false, error: `Invalid size ${size} for pizza ${pizzaId}` };
    }

    const totalPrice = calculateItemPrice(
      pizza!.basePrice,
      size,
      priceMultiplier,
      selectedToppings,
      pizza!.defaultToppings
    );

    recalculated[i] = {
      id: randomUUID(),
      pizzaId,
      pizzaName: pizza!.name,
      size,
      basePrice: pizza!.basePrice,
      selectedToppings,
      quantity,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
  }

  return { valid: true, recalculated };
}

/**
 * Handles POST requests to create a new pizza order.
 * Expects a JSON payload containing `customerInfo` and `items`.
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || randomUUID();
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
          { endpoint: '/api/orders', requestId }
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
      { itemCount: body.items?.length || 0, requestId }
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
      { orderId: order.id, requestId }
    );

    logger.info('Order created', {
      requestId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      itemCount: order.items.length,
      total: order.total,
    });

    return NextResponse.json({
      success: true,
      data: order,
    }, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    // Log error securely (avoid exposing sensitive details to the client)
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
        },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    logger.error('Order creation failed', {
      requestId,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
      },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
      }
    },
    PERFORMANCE_THRESHOLDS.API_REQUEST,
    { endpoint: '/api/orders', method: 'POST', requestId }
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
