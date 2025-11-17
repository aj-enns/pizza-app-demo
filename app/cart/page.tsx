'use client';

import { useCart } from '@/contexts/CartContext';
import CartItem from '@/components/CartItem';
import CartSummary from '@/components/CartSummary';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-6">
            <ShoppingBag size={64} className="text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Your Cart is Empty</h1>
          <p className="text-xl text-gray-600 mb-8">
            Add some delicious pizzas to get started!
          </p>
          <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
            Browse Menu
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Your Cart ({itemCount} items)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </div>
        
        <div>
          <CartSummary />
          <Link href="/checkout" className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
            Proceed to Checkout
            <ArrowRight size={20} />
          </Link>
          <Link href="/menu" className="btn-secondary w-full mt-3 flex items-center justify-center">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
