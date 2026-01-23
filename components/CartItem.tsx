'use client';

import { CartItem as CartItemType } from '@/lib/types';
import { formatPrice, SIZE_LABELS, getToppingById, getCrustById } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, X } from 'lucide-react';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  // For custom pizzas, show all toppings with placement
  const renderCustomToppings = () => {
    if (!item.customToppings || item.customToppings.length === 0) return null;
    
    const fullToppings = item.customToppings
      .filter(t => t.placement === 'full')
      .map(t => getToppingById(t.toppingId)?.name)
      .filter(Boolean);
    
    const leftToppings = item.customToppings
      .filter(t => t.placement === 'left')
      .map(t => getToppingById(t.toppingId)?.name)
      .filter(Boolean);
    
    const rightToppings = item.customToppings
      .filter(t => t.placement === 'right')
      .map(t => getToppingById(t.toppingId)?.name)
      .filter(Boolean);
    
    return (
      <div className="mb-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
        {fullToppings.length > 0 && (
          <p>Whole: {fullToppings.join(', ')}</p>
        )}
        {leftToppings.length > 0 && (
          <p>Left Half: {leftToppings.join(', ')}</p>
        )}
        {rightToppings.length > 0 && (
          <p>Right Half: {rightToppings.join(', ')}</p>
        )}
      </div>
    );
  };

  // For regular pizzas, show extra toppings
  const extraToppings = !item.isCustom
    ? item.selectedToppings.filter(toppingId => {
        const topping = getToppingById(toppingId);
        return topping && topping.price > 0;
      })
    : [];

  return (
    <div className="card p-4 mb-4 animate-slide-up">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {item.pizzaName}
                {item.isCustom && (
                  <span className="ml-2 text-xs font-normal bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-1 rounded">
                    Custom
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{SIZE_LABELS[item.size]}</p>
              {item.customCrust && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getCrustById(item.customCrust)?.name}
                </p>
              )}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-500 transition-colors"
              aria-label="Remove item"
            >
              <X size={20} />
            </button>
          </div>
          
          {item.isCustom ? renderCustomToppings() : (
            extraToppings.length > 0 && (
              <div className="mb-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Extra: {extraToppings.map(id => getToppingById(id)?.name).join(', ')}
                </p>
              </div>
            )
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-500 transition-colors flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="font-semibold text-lg w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-500 transition-colors flex items-center justify-center"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold text-primary-600 dark:text-primary-500">
                {formatPrice(item.totalPrice * item.quantity)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatPrice(item.totalPrice)} each
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
