'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Clock, ArrowRight } from 'lucide-react';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrder(data.data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 dark:border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Order not found</h1>
        <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
          Back to Menu
          <ArrowRight size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <CheckCircle size={56} className="text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Thank you for your order. We&apos;re preparing your delicious pizza!
          </p>
        </div>

        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-6 pb-6 border-b dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-500">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-2 rounded-full font-semibold">
                {order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <Clock className="text-primary-600 dark:text-primary-500" size={24} />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Estimated Delivery</p>
                <p className="text-gray-600 dark:text-gray-400">30-45 minutes</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <Package className="text-primary-600 dark:text-primary-500" size={24} />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Delivering To</p>
                <p className="text-gray-600 dark:text-gray-400">{order.customerInfo.address}</p>
                <p className="text-gray-600 dark:text-gray-400">{order.customerInfo.city}, {order.customerInfo.zipCode}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start border-b dark:border-gray-700 pb-4 last:border-0">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{item.pizzaName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Size: {item.size} • Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(item.totalPrice * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t dark:border-gray-700 mt-6 pt-6 space-y-2">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100 pt-2 border-t dark:border-gray-700">
              <span>Total</span>
              <span className="text-primary-600 dark:text-primary-500">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
            Order Again
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 dark:border-primary-500 mx-auto"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
