'use client';

import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';

export default function CartSummary() {
  const { subtotal, tax, deliveryFee, total } = useCart();

  return (
    <div className="card p-6 sticky top-24">
      <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-gray-700">
          <span>Tax (8%)</span>
          <span>{formatPrice(tax)}</span>
        </div>
        
        <div className="flex justify-between text-gray-700">
          <span>Delivery Fee</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>
        
        <div className="border-t-2 border-gray-200 pt-3 mt-3">
          <div className="flex justify-between text-xl font-bold text-gray-900">
            <span>Total</span>
            <span className="text-primary-600">{formatPrice(total)}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-primary-800">
          🚚 Estimated delivery: <strong>30-45 minutes</strong>
        </p>
      </div>
    </div>
  );
}
