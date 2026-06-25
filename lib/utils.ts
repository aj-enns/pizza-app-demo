import { Pizza, Topping, PizzaSize, CartItem, Crust, ToppingWithPlacement } from './types';
import menuData from './data/menu.json';
import { trackPerformanceSync, PERFORMANCE_THRESHOLDS } from './performance';

// Menu data structure interface
interface MenuData {
  pizzas: Pizza[];
  toppings: Topping[];
  crusts: Crust[];
}

// Type-safe menu data
const typedMenuData = menuData as unknown as MenuData;

// Indexed lookups built once at module load — O(1) access instead of Array.find per call.
// Menu data is static (imported from JSON), so these maps never need invalidation.
const pizzaById = new Map<string, Pizza>(typedMenuData.pizzas.map(p => [p.id, p]));
const toppingById = new Map<string, Topping>(typedMenuData.toppings.map(t => [t.id, t]));
const crustById = new Map<string, Crust>(typedMenuData.crusts.map(c => [c.id, c]));

// Get all pizzas
export function getPizzas(): Pizza[] {
  return trackPerformanceSync(
    'getPizzas',
    () => typedMenuData.pizzas,
    PERFORMANCE_THRESHOLDS.DATABASE_QUERY,
    { operation: 'readMenuData', pizzaCount: typedMenuData.pizzas.length }
  );
}

// Get menu pizzas (excludes custom/build-your-own)
export function getMenuPizzas(): Pizza[] {
  return getPizzas().filter(p => p.category !== 'custom');
}

// Get pizza by ID
export function getPizzaById(id: string): Pizza | undefined {
  return pizzaById.get(id);
}

// Get all toppings
export function getToppings(): Topping[] {
  return typedMenuData.toppings;
}

// Get topping by ID
export function getToppingById(id: string): Topping | undefined {
  return toppingById.get(id);
}

// Get all crusts
export function getCrusts(): Crust[] {
  return typedMenuData.crusts;
}

// Get crust by ID
export function getCrustById(id: string): Crust | undefined {
  return crustById.get(id);
}

// Size labels for display
export const SIZE_LABELS: Record<PizzaSize, string> = {
  small: 'Small (10")',
  medium: 'Medium (12")',
  large: 'Large (14")',
  xlarge: 'X-Large (16")',
};

// Calculate total price for a cart item
export function calculateItemPrice(
  basePrice: number,
  size: PizzaSize,
  sizeMultiplier: number,
  toppings: string[],
  defaultToppings: string[]
): number {
  return trackPerformanceSync(
    'calculateItemPrice',
    () => {
      const sizedPrice = basePrice * sizeMultiplier;

      // Sum extra-topping prices in a single pass.
      // Set lookup is O(1) vs Array.includes O(n); Map lookup avoids per-topping Array.find.
      const defaults = defaultToppings.length > 0 ? new Set(defaultToppings) : null;
      let toppingsPrice = 0;
      for (let i = 0; i < toppings.length; i++) {
        const id = toppings[i];
        if (defaults?.has(id)) continue;
        const topping = toppingById.get(id);
        if (topping) toppingsPrice += topping.price;
      }

      return sizedPrice + toppingsPrice;
    },
    PERFORMANCE_THRESHOLDS.CALCULATION,
    { size, toppingCount: toppings.length, basePrice }
  );
}

// Calculate price for custom pizza with half-and-half toppings
export function calculateCustomItemPrice(
  basePrice: number,
  size: PizzaSize,
  sizeMultiplier: number,
  customToppings: ToppingWithPlacement[],
  defaultToppings: string[],
  customCrust?: string
): number {
  return trackPerformanceSync(
    'calculateCustomItemPrice',
    () => {
      const sizedPrice = basePrice * sizeMultiplier;
      
      // Calculate custom toppings cost
      let toppingsPrice = 0;
      const toppingCounts = new Map<string, { full: number; half: number }>();
      const defaults = defaultToppings.length > 0 ? new Set(defaultToppings) : null;

      // Count toppings by placement
      customToppings.forEach(({ toppingId, placement }) => {
        if (!defaults?.has(toppingId)) {
          const current = toppingCounts.get(toppingId) || { full: 0, half: 0 };
          if (placement === 'full') {
            current.full += 1;
          } else {
            current.half += 1;
          }
          toppingCounts.set(toppingId, current);
        }
      });
      
      // Calculate price: full placement = full price, two halves = full price, one half = half price
      toppingCounts.forEach((counts, toppingId) => {
        const topping = getToppingById(toppingId);
        if (topping) {
          const fullCount = counts.full;
          const halfCount = counts.half;
          
          // Each full placement counts as full price
          toppingsPrice += fullCount * topping.price;
          
          // Every two half placements count as one full price
          const fullFromHalves = Math.floor(halfCount / 2);
          const remainingHalf = halfCount % 2;
          
          toppingsPrice += fullFromHalves * topping.price;
          toppingsPrice += remainingHalf * (topping.price / 2);
        }
      });
      
      // Add crust price if custom
      let crustPrice = 0;
      if (customCrust) {
        const crust = getCrustById(customCrust);
        crustPrice = crust?.price || 0;
      }
      
      return sizedPrice + toppingsPrice + crustPrice;
    },
    PERFORMANCE_THRESHOLDS.CALCULATION,
    { size, toppingCount: customToppings.length, basePrice }
  );
}

// Calculate cart totals
export function calculateCartTotals(items: CartItem[]) {
  return trackPerformanceSync(
    'calculateCartTotals',
    () => {
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice * item.quantity, 0);
      const tax = subtotal * 0.08; // 8% tax
      const deliveryFee = subtotal > 0 ? 4.99 : 0;
      const total = subtotal + tax + deliveryFee;
      
      return {
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        total: Number(total.toFixed(2)),
      };
    },
    PERFORMANCE_THRESHOLDS.CALCULATION,
    { itemCount: items.length, hasItems: items.length > 0 }
  );
}

// Generate unique order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Format price for display
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
