import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { PizzaSize } from '@/lib/types';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have empty cart on initialization', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.tax).toBe(0);
      expect(result.current.deliveryFee).toBe(0);
      expect(result.current.total).toBe(0);
    });

    it('should throw error when useCart is used outside CartProvider', () => {
      // Suppress console.error for this test
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useCart());
      }).toThrow('useCart must be used within a CartProvider');
      
      spy.mockRestore();
    });
  });

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella', 'tomato-sauce']);
      });
      
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].pizzaId).toBe('margherita');
      expect(result.current.items[0].size).toBe('medium');
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.itemCount).toBe(1);
    });

    it('should increase quantity if identical item already exists', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.itemCount).toBe(2);
    });

    it('should add separate items for different sizes', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
        result.current.addItem('margherita', 'large', ['mozzarella']);
      });
      
      expect(result.current.items).toHaveLength(2);
      expect(result.current.itemCount).toBe(2);
    });

    it('should update cart totals when item is added', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      expect(result.current.subtotal).toBeGreaterThan(0);
      expect(result.current.tax).toBeGreaterThan(0);
      expect(result.current.deliveryFee).toBe(4.99);
      expect(result.current.total).toBeGreaterThan(0);
    });

    it('should save to localStorage when item is added', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const saved = localStorage.getItem('pizza-cart');
      expect(saved).toBeTruthy();
      const items = JSON.parse(saved!);
      expect(items).toHaveLength(1);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.removeItem(itemId);
      });
      
      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
    });

    it('should update totals after removing item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.removeItem(itemId);
      });
      
      expect(result.current.subtotal).toBe(0);
      expect(result.current.tax).toBe(0);
      expect(result.current.deliveryFee).toBe(0);
      expect(result.current.total).toBe(0);
    });

    it('should update localStorage after removing item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.removeItem(itemId);
      });
      
      const saved = localStorage.getItem('pizza-cart');
      expect(saved).toBeTruthy();
      const items = JSON.parse(saved!);
      expect(items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.updateQuantity(itemId, 3);
      });
      
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.itemCount).toBe(3);
    });

    it('should remove item when quantity is set to 0', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.updateQuantity(itemId, 0);
      });
      
      expect(result.current.items).toHaveLength(0);
    });

    it('should remove item when quantity is negative', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const itemId = result.current.items[0].id;
      
      act(() => {
        result.current.updateQuantity(itemId, -1);
      });
      
      expect(result.current.items).toHaveLength(0);
    });

    it('should update totals when quantity changes', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      const itemId = result.current.items[0].id;
      const initialSubtotal = result.current.subtotal;
      
      act(() => {
        result.current.updateQuantity(itemId, 2);
      });
      
      expect(result.current.subtotal).toBe(initialSubtotal * 2);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
        result.current.addItem('pepperoni', 'large', ['pepperoni']);
      });
      
      expect(result.current.items.length).toBeGreaterThan(0);
      
      act(() => {
        result.current.clearCart();
      });
      
      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
    });

    it('should reset all totals to zero', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      act(() => {
        result.current.clearCart();
      });
      
      expect(result.current.subtotal).toBe(0);
      expect(result.current.tax).toBe(0);
      expect(result.current.deliveryFee).toBe(0);
      expect(result.current.total).toBe(0);
    });

    it('should clear localStorage', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      
      act(() => {
        result.current.addItem('margherita', 'medium', ['mozzarella']);
      });
      
      act(() => {
        result.current.clearCart();
      });
      
      const saved = localStorage.getItem('pizza-cart');
      expect(saved).toBeTruthy();
      const items = JSON.parse(saved!);
      expect(items).toHaveLength(0);
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should load cart from localStorage on mount', () => {
      const mockCart = [
        {
          id: 'test-1',
          pizzaId: 'margherita',
          pizzaName: 'Margherita',
          size: 'medium' as PizzaSize,
          basePrice: 10.99,
          selectedToppings: ['mozzarella'],
          quantity: 2,
          totalPrice: 10.99,
        },
      ];
      
      localStorage.setItem('pizza-cart', JSON.stringify(mockCart));
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      // Wait for useEffect to run
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].pizzaId).toBe('margherita');
      expect(result.current.itemCount).toBe(2);
    });

    it('should handle invalid localStorage data gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('pizza-cart', 'invalid json');
      
      const { result } = renderHook(() => useCart(), { wrapper });
      
      expect(result.current.items).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load cart:',
        expect.any(SyntaxError)
      );
      consoleSpy.mockRestore();
    });
  });
});
