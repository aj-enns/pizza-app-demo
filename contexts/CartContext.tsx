'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, PizzaSize } from '@/lib/types';
import { calculateCartTotals, calculateItemPrice, getPizzaById } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { pizzaId: string; size: PizzaSize; selectedToppings: string[] } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType extends CartState {
  addItem: (pizzaId: string, size: PizzaSize, selectedToppings: string[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'pizza-cart';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { pizzaId, size, selectedToppings } = action.payload;
      const pizza = getPizzaById(pizzaId);
      
      if (!pizza) return state;
      
      const sizeConfig = pizza.sizes.find(s => s.size === size);
      if (!sizeConfig) return state;
      
      const basePrice = pizza.basePrice;
      const totalPrice = calculateItemPrice(
        basePrice,
        size,
        sizeConfig.priceMultiplier,
        selectedToppings,
        pizza.defaultToppings
      );
      
      // Check if identical item exists
      const existingItemIndex = state.items.findIndex(
        item =>
          item.pizzaId === pizzaId &&
          item.size === size &&
          JSON.stringify(item.selectedToppings.sort()) === JSON.stringify(selectedToppings.sort())
      );
      
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Increase quantity of existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${pizzaId}-${size}-${Date.now()}`,
          pizzaId,
          pizzaName: pizza.name,
          size,
          basePrice,
          selectedToppings,
          quantity: 1,
          totalPrice,
        };
        newItems = [...state.items, newItem];
      }
      
      const totals = calculateCartTotals(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: newItems,
        ...totals,
        itemCount,
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const totals = calculateCartTotals(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: newItems,
        ...totals,
        itemCount,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: id });
      }
      
      const newItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      
      const totals = calculateCartTotals(newItems);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items: newItems,
        ...totals,
        itemCount,
      };
    }
    
    case 'CLEAR_CART': {
      return {
        items: [],
        subtotal: 0,
        tax: 0,
        deliveryFee: 0,
        total: 0,
        itemCount: 0,
      };
    }
    
    case 'LOAD_CART': {
      const items = action.payload;
      const totals = calculateCartTotals(items);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      
      return {
        items,
        ...totals,
        itemCount,
      };
    }
    
    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  deliveryFee: 0,
  total: 0,
  itemCount: 0,
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const items = JSON.parse(saved) as CartItem[];
        dispatch({ type: 'LOAD_CART', payload: items });
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);
  
  const addItem = (pizzaId: string, size: PizzaSize, selectedToppings: string[]) => {
    dispatch({ type: 'ADD_ITEM', payload: { pizzaId, size, selectedToppings } });
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
