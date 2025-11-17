'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Pizza } from 'lucide-react';

export default function Header() {
  const { itemCount } = useCart();

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
            <Pizza size={32} className="text-primary-600" />
            <span>PizzaHub</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/menu" className="text-gray-700 hover:text-primary-600 font-semibold transition-colors">
              Menu
            </Link>
            <Link href="/cart" className="relative flex items-center gap-2 text-gray-700 hover:text-primary-600 font-semibold transition-colors">
              <ShoppingCart size={24} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
