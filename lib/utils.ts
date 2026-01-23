import { Pizza, Topping, PizzaSize, CartItem, Crust, ToppingWithPlacement } from './types';
import menuData from './data/menu.json';
import { trackPerformanceSync, PERFORMANCE_THRESHOLDS } from './performance';

// Get all pizzas
export function getPizzas(): Pizza[] {
  return trackPerformanceSync(
    'getPizzas',
    () => menuData.pizzas as Pizza[],
    PERFORMANCE_THRESHOLDS.DATABASE_QUERY,
    { operation: 'readMenuData', pizzaCount: menuData.pizzas.length }
  );
}

// Get pizza by ID
export function getPizzaById(id: string): Pizza | undefined {
  return menuData.pizzas.find(pizza => pizza.id === id) as Pizza | undefined;
}

// Get all toppings
export function getToppings(): Topping[] {
  return menuData.toppings as Topping[];
}

// Get topping by ID
export function getToppingById(id: string): Topping | undefined {
  return menuData.toppings.find(topping => topping.id === id) as Topping | undefined;
}

// Get all crusts
export function getCrusts(): Crust[] {
  return (menuData as any).crusts as Crust[];
}

// Get crust by ID
export function getCrustById(id: string): Crust | undefined {
  return (menuData as any).crusts?.find((crust: any) => crust.id === id) as Crust | undefined;
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
      
      // Calculate extra toppings cost (toppings not included by default)
      const extraToppings = toppings.filter(t => !defaultToppings.includes(t));
      const toppingsPrice = extraToppings.reduce((sum, toppingId) => {
        const topping = getToppingById(toppingId);
        return sum + (topping?.price || 0);
      }, 0);
      
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
      
      // Count toppings by placement
      customToppings.forEach(({ toppingId, placement }) => {
        if (!defaultToppings.includes(toppingId)) {
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
