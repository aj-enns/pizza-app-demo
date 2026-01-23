import {
  getPizzas,
  getPizzaById,
  getToppings,
  getToppingById,
  getCrusts,
  getCrustById,
  calculateItemPrice,
  calculateCustomItemPrice,
  calculateCartTotals,
  generateOrderNumber,
  formatPrice,
  SIZE_LABELS,
} from '../utils';
import { CartItem, PizzaSize, ToppingWithPlacement } from '../types';

describe('utils', () => {
  describe('getPizzas', () => {
    it('should return an array of pizzas', () => {
      const pizzas = getPizzas();
      expect(Array.isArray(pizzas)).toBe(true);
      expect(pizzas.length).toBeGreaterThan(0);
    });

    it('should return pizzas with correct properties', () => {
      const pizzas = getPizzas();
      const pizza = pizzas[0];
      expect(pizza).toHaveProperty('id');
      expect(pizza).toHaveProperty('name');
      expect(pizza).toHaveProperty('basePrice');
      expect(pizza).toHaveProperty('sizes');
    });
  });

  describe('getPizzaById', () => {
    it('should return a pizza when valid ID is provided', () => {
      const pizzas = getPizzas();
      const firstPizza = pizzas[0];
      const pizza = getPizzaById(firstPizza.id);
      expect(pizza).toBeDefined();
      expect(pizza?.id).toBe(firstPizza.id);
    });

    it('should return undefined when invalid ID is provided', () => {
      const pizza = getPizzaById('non-existent-id');
      expect(pizza).toBeUndefined();
    });
  });

  describe('getToppings', () => {
    it('should return an array of toppings', () => {
      const toppings = getToppings();
      expect(Array.isArray(toppings)).toBe(true);
      expect(toppings.length).toBeGreaterThan(0);
    });

    it('should return toppings with correct properties', () => {
      const toppings = getToppings();
      const topping = toppings[0];
      expect(topping).toHaveProperty('id');
      expect(topping).toHaveProperty('name');
      expect(topping).toHaveProperty('price');
      expect(topping).toHaveProperty('category');
    });
  });

  describe('getToppingById', () => {
    it('should return a topping when valid ID is provided', () => {
      const toppings = getToppings();
      const firstTopping = toppings[0];
      const topping = getToppingById(firstTopping.id);
      expect(topping).toBeDefined();
      expect(topping?.id).toBe(firstTopping.id);
    });

    it('should return undefined when invalid ID is provided', () => {
      const topping = getToppingById('non-existent-topping');
      expect(topping).toBeUndefined();
    });
  });

  describe('SIZE_LABELS', () => {
    it('should have labels for all pizza sizes', () => {
      expect(SIZE_LABELS.small).toBe('Small (10")');
      expect(SIZE_LABELS.medium).toBe('Medium (12")');
      expect(SIZE_LABELS.large).toBe('Large (14")');
      expect(SIZE_LABELS.xlarge).toBe('X-Large (16")');
    });
  });

  describe('calculateItemPrice', () => {
    it('should calculate price with size multiplier only', () => {
      const basePrice = 10;
      const size: PizzaSize = 'medium';
      const sizeMultiplier = 1.2;
      const toppings: string[] = [];
      const defaultToppings: string[] = [];

      const price = calculateItemPrice(basePrice, size, sizeMultiplier, toppings, defaultToppings);
      expect(price).toBe(12); // 10 * 1.2
    });

    it('should calculate price with extra toppings', () => {
      const basePrice = 10;
      const size: PizzaSize = 'medium';
      const sizeMultiplier = 1;
      const toppings = ['pepperoni', 'mushrooms'];
      const defaultToppings: string[] = [];

      const price = calculateItemPrice(basePrice, size, sizeMultiplier, toppings, defaultToppings);
      expect(price).toBeGreaterThan(10);
    });

    it('should not charge for default toppings', () => {
      const basePrice = 10;
      const size: PizzaSize = 'medium';
      const sizeMultiplier = 1;
      const toppings = ['pepperoni', 'mushrooms'];
      const defaultToppings = ['pepperoni', 'mushrooms'];

      const price = calculateItemPrice(basePrice, size, sizeMultiplier, toppings, defaultToppings);
      expect(price).toBe(10); // No extra charge for default toppings
    });

    it('should only charge for extra toppings beyond defaults', () => {
      const basePrice = 10;
      const size: PizzaSize = 'medium';
      const sizeMultiplier = 1;
      const toppings = ['pepperoni', 'mushroom', 'olive'];
      const defaultToppings = ['pepperoni'];

      const price = calculateItemPrice(basePrice, size, sizeMultiplier, toppings, defaultToppings);
      // mushroom (1.5) + olive (1.5) = 3.0 extra
      expect(price).toBe(13);
    });
  });

  describe('calculateCartTotals', () => {
    it('should return zero totals for empty cart', () => {
      const items: CartItem[] = [];
      const totals = calculateCartTotals(items);

      expect(totals.subtotal).toBe(0);
      expect(totals.tax).toBe(0);
      expect(totals.deliveryFee).toBe(0);
      expect(totals.total).toBe(0);
    });

    it('should calculate correct totals for single item', () => {
      const items: CartItem[] = [
        {
          id: '1',
          pizzaId: 'margherita',
          pizzaName: 'Margherita',
          size: 'medium',
          basePrice: 10,
          selectedToppings: [],
          quantity: 1,
          totalPrice: 10,
        },
      ];

      const totals = calculateCartTotals(items);
      expect(totals.subtotal).toBe(10);
      expect(totals.tax).toBe(0.8); // 8% of 10
      expect(totals.deliveryFee).toBe(4.99);
      expect(totals.total).toBe(15.79); // 10 + 0.8 + 4.99
    });

    it('should calculate correct totals for multiple items', () => {
      const items: CartItem[] = [
        {
          id: '1',
          pizzaId: 'margherita',
          pizzaName: 'Margherita',
          size: 'medium',
          basePrice: 10,
          selectedToppings: [],
          quantity: 2,
          totalPrice: 10,
        },
        {
          id: '2',
          pizzaId: 'pepperoni',
          pizzaName: 'Pepperoni',
          size: 'large',
          basePrice: 12,
          selectedToppings: [],
          quantity: 1,
          totalPrice: 12,
        },
      ];

      const totals = calculateCartTotals(items);
      const expectedSubtotal = 32; // (10 * 2) + (12 * 1)
      const expectedTax = 2.56; // 8% of 32
      const expectedTotal = 39.55; // 32 + 2.56 + 4.99

      expect(totals.subtotal).toBe(expectedSubtotal);
      expect(totals.tax).toBe(expectedTax);
      expect(totals.deliveryFee).toBe(4.99);
      expect(totals.total).toBe(expectedTotal);
    });

    it('should round totals to 2 decimal places', () => {
      const items: CartItem[] = [
        {
          id: '1',
          pizzaId: 'test',
          pizzaName: 'Test Pizza',
          size: 'medium',
          basePrice: 10.33,
          selectedToppings: [],
          quantity: 1,
          totalPrice: 10.33,
        },
      ];

      const totals = calculateCartTotals(items);
      expect(totals.subtotal.toString()).toMatch(/^\d+\.\d{2}$/);
      expect(totals.tax.toString()).toMatch(/^\d+\.\d{2}$/);
      expect(totals.total.toString()).toMatch(/^\d+\.\d{2}$/);
    });
  });

  describe('generateOrderNumber', () => {
    it('should generate a unique order number', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('should generate different order numbers on successive calls', () => {
      const orderNumber1 = generateOrderNumber();
      const orderNumber2 = generateOrderNumber();
      expect(orderNumber1).not.toBe(orderNumber2);
    });

    it('should start with ORD- prefix', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber.startsWith('ORD-')).toBe(true);
    });
  });

  describe('formatPrice', () => {
    it('should format whole numbers correctly', () => {
      expect(formatPrice(10)).toBe('$10.00');
      expect(formatPrice(100)).toBe('$100.00');
    });

    it('should format decimal numbers correctly', () => {
      expect(formatPrice(10.5)).toBe('$10.50');
      expect(formatPrice(10.99)).toBe('$10.99');
    });

    it('should handle zero correctly', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatPrice(10.999)).toBe('$11.00');
      // JavaScript rounds 10.555 to 10.55 (banker's rounding)
      expect(formatPrice(10.556)).toBe('$10.56');
    });

    it('should handle negative numbers', () => {
      expect(formatPrice(-10.50)).toBe('$-10.50');
    });
  });

  describe('getCrusts', () => {
    it('should return an array of crusts', () => {
      const crusts = getCrusts();
      expect(Array.isArray(crusts)).toBe(true);
      expect(crusts.length).toBeGreaterThan(0);
    });

    it('should return crusts with correct properties', () => {
      const crusts = getCrusts();
      const crust = crusts[0];
      expect(crust).toHaveProperty('id');
      expect(crust).toHaveProperty('name');
      expect(crust).toHaveProperty('price');
    });

    it('should include regular crust with zero price', () => {
      const crusts = getCrusts();
      const regularCrust = crusts.find(c => c.id === 'regular');
      expect(regularCrust).toBeDefined();
      expect(regularCrust?.price).toBe(0);
    });
  });

  describe('getCrustById', () => {
    it('should return a crust when valid ID is provided', () => {
      const crust = getCrustById('regular');
      expect(crust).toBeDefined();
      expect(crust?.id).toBe('regular');
    });

    it('should return undefined when invalid ID is provided', () => {
      const crust = getCrustById('non-existent-crust');
      expect(crust).toBeUndefined();
    });
  });

  describe('calculateCustomItemPrice', () => {
    const pizza = getPizzas()[0];
    const sizeConfig = pizza.sizes.find(s => s.size === 'medium');

    it('should calculate price for custom pizza with full toppings', () => {
      const customToppings: ToppingWithPlacement[] = [
        { toppingId: 'pepperoni', placement: 'full' },
        { toppingId: 'mushroom', placement: 'full' },
      ];
      
      const price = calculateCustomItemPrice(
        pizza.basePrice,
        'medium',
        sizeConfig!.priceMultiplier,
        customToppings,
        pizza.defaultToppings,
        'regular'
      );
      
      // Base price * multiplier + pepperoni (2.0) + mushroom (1.5)
      const expectedPrice = pizza.basePrice * sizeConfig!.priceMultiplier + 2.0 + 1.5;
      expect(price).toBe(expectedPrice);
    });

    it('should calculate price for half toppings correctly', () => {
      const customToppings: ToppingWithPlacement[] = [
        { toppingId: 'pepperoni', placement: 'left' },
        { toppingId: 'mushroom', placement: 'right' },
      ];
      
      const price = calculateCustomItemPrice(
        pizza.basePrice,
        'medium',
        sizeConfig!.priceMultiplier,
        customToppings,
        pizza.defaultToppings,
        'regular'
      );
      
      // Base price * multiplier + (pepperoni/2) (1.0) + (mushroom/2) (0.75)
      const expectedPrice = pizza.basePrice * sizeConfig!.priceMultiplier + 1.0 + 0.75;
      expect(price).toBe(expectedPrice);
    });

    it('should treat two halves of same topping as one full topping', () => {
      const customToppings: ToppingWithPlacement[] = [
        { toppingId: 'pepperoni', placement: 'left' },
        { toppingId: 'pepperoni', placement: 'right' },
      ];
      
      const price = calculateCustomItemPrice(
        pizza.basePrice,
        'medium',
        sizeConfig!.priceMultiplier,
        customToppings,
        pizza.defaultToppings,
        'regular'
      );
      
      // Base price * multiplier + pepperoni full price (2.0)
      const expectedPrice = pizza.basePrice * sizeConfig!.priceMultiplier + 2.0;
      expect(price).toBe(expectedPrice);
    });

    it('should add custom crust price', () => {
      const customToppings: ToppingWithPlacement[] = [];
      
      const price = calculateCustomItemPrice(
        pizza.basePrice,
        'medium',
        sizeConfig!.priceMultiplier,
        customToppings,
        pizza.defaultToppings,
        'stuffed' // Stuffed crust costs 3.0
      );
      
      // Base price * multiplier + stuffed crust (3.0)
      const expectedPrice = pizza.basePrice * sizeConfig!.priceMultiplier + 3.0;
      expect(price).toBe(expectedPrice);
    });

    it('should not charge for default toppings', () => {
      // Add default toppings back with custom placement
      const defaultTopping = pizza.defaultToppings[0];
      const customToppings: ToppingWithPlacement[] = [
        { toppingId: defaultTopping, placement: 'full' },
      ];
      
      const price = calculateCustomItemPrice(
        pizza.basePrice,
        'medium',
        sizeConfig!.priceMultiplier,
        customToppings,
        pizza.defaultToppings,
        'regular'
      );
      
      // Should only charge base price, not for default topping
      const expectedPrice = pizza.basePrice * sizeConfig!.priceMultiplier;
      expect(price).toBe(expectedPrice);
    });

    it('should handle mixed full and half toppings', () => {
      const customToppings: ToppingWithPlacement[] = [
        { toppingId: 'pepperoni', placement: 'full' },
        { toppingId: 'mushroom', placement: 'left' },
        { toppingId: 'onion', placement: 'right' },
      ];
      
      const price = calculateCustomItemPrice(
        pizza.basePrice,
        'medium',
        sizeConfig!.priceMultiplier,
        customToppings,
        pizza.defaultToppings,
        'regular'
      );
      
      // Base price + pepperoni (2.0) + mushroom/2 (0.75) + onion/2 (0.5)
      const expectedPrice = pizza.basePrice * sizeConfig!.priceMultiplier + 2.0 + 0.75 + 0.5;
      expect(price).toBe(expectedPrice);
    });
  });
});
