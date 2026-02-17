// Pizza and Menu Types
export type PizzaSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface Topping {
  id: string;
  name: string;
  price: number;
  category: 'meat' | 'vegetable' | 'cheese' | 'sauce';
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
  userId?: string; // Optional - for logged-in users
  customerInfo: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed';
  createdAt: string;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  password: string; // Hashed password
  name: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
