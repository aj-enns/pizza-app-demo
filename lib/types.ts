// Pizza and Menu Types
export type PizzaSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ToppingPlacement = 'full' | 'left' | 'right';

export interface Topping {
  id: string;
  name: string;
  price: number;
  category: 'meat' | 'vegetable' | 'cheese' | 'sauce';
}

export interface Crust {
  id: string;
  name: string;
  price: number;
}

export interface ToppingWithPlacement {
  toppingId: string;
  placement: ToppingPlacement;
}

export interface Pizza {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'specialty' | 'vegetarian' | 'premium';
  imageUrl: string;
  basePrice: number;
  sizes: {
    size: PizzaSize;
    priceMultiplier: number;
  }[];
  defaultToppings: string[];
}

export interface PizzaSizePrice {
  size: PizzaSize;
  label: string;
  priceMultiplier: number;
}

// Cart Types
export interface CartItem {
  id: string;
  pizzaId: string;
  pizzaName: string;
  size: PizzaSize;
  basePrice: number;
  selectedToppings: string[];
  quantity: number;
  totalPrice: number;
  // Customization fields
  customToppings?: ToppingWithPlacement[];
  customCrust?: string;
  customSauce?: string;
  isCustom?: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
}

// Order Types
export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  deliveryInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerInfo: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed';
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
