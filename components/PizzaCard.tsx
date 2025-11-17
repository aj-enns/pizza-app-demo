'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pizza, PizzaSize } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { SIZE_LABELS, formatPrice, calculateItemPrice } from '@/lib/utils';
import { Plus, Check } from 'lucide-react';

interface PizzaCardProps {
  pizza: Pizza;
}

export default function PizzaCard({ pizza }: PizzaCardProps) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('medium');
  const [showCustomize, setShowCustomize] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const sizeConfig = pizza.sizes.find(s => s.size === selectedSize);
  const currentPrice = sizeConfig 
    ? calculateItemPrice(pizza.basePrice, selectedSize, sizeConfig.priceMultiplier, pizza.defaultToppings, pizza.defaultToppings)
    : pizza.basePrice;

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(pizza.id, selectedSize, pizza.defaultToppings);
    
    setTimeout(() => {
      setIsAdding(false);
    }, 1000);
  };

  return (
    <div className="card overflow-hidden group animate-fade-in">
      <div className="relative h-64 overflow-hidden">
        <Image
          src={pizza.imageUrl}
          alt={pizza.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-4 right-4">
          <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {pizza.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2 text-gray-900">{pizza.name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{pizza.description}</p>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Size:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {pizza.sizes.map(({ size }) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  selectedSize === size
                    ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {SIZE_LABELS[size].split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-primary-600">
            {formatPrice(currentPrice)}
          </span>
        </div>
        
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isAdding ? (
            <>
              <Check size={20} />
              Added!
            </>
          ) : (
            <>
              <Plus size={20} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
