'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pizza, PizzaSize } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { SIZE_LABELS, formatPrice, calculateItemPrice, getToppings } from '@/lib/utils';
import { Plus, Check, Settings } from 'lucide-react';

interface PizzaCardProps {
  pizza: Pizza;
}

export default function PizzaCard({ pizza }: PizzaCardProps) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('medium');
  const [isAdding, setIsAdding] = useState(false);

  // Cheese options
  const cheeseOptions = useMemo(
    () => getToppings().filter(t => t.category === 'cheese'),
    []
  );

  // Default cheese for this pizza (usually mozzarella)
  const defaultCheese = useMemo(
    () => pizza.defaultToppings.find(t => cheeseOptions.some(c => c.id === t)) || 'mozzarella',
    [pizza.defaultToppings, cheeseOptions]
  );

  const [selectedCheese, setSelectedCheese] = useState<string>(defaultCheese);

  // Current toppings = default toppings minus default cheese, plus selected cheese
  const currentToppings = useMemo(() => {
    const toppingsWithoutCheese = pizza.defaultToppings.filter(
      t => !cheeseOptions.some(c => c.id === t)
    );
    return [...toppingsWithoutCheese, selectedCheese];
  }, [pizza.defaultToppings, selectedCheese, cheeseOptions]);

  const sizeConfig = useMemo(
    () => pizza.sizes.find(s => s.size === selectedSize),
    [pizza.sizes, selectedSize]
  );

  const currentPrice = useMemo(
    () => sizeConfig
      ? calculateItemPrice(pizza.basePrice, selectedSize, sizeConfig.priceMultiplier, currentToppings, pizza.defaultToppings)
      : pizza.basePrice,
    [pizza.basePrice, selectedSize, sizeConfig, currentToppings, pizza.defaultToppings]
  );

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem(pizza.id, selectedSize, currentToppings);

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
        <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{pizza.name}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{pizza.description}</p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Size:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {pizza.sizes.map(({ size }) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  selectedSize === size
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {SIZE_LABELS[size].split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Cheese:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cheeseOptions.map((cheese) => {
              const isUpgrade = cheese.price > 0;
              const isSelected = selectedCheese === cheese.id;
              return (
                <button
                  key={cheese.id}
                  onClick={() => setSelectedCheese(cheese.id)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm">{cheese.name}</div>
                  {isUpgrade && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{formatPrice(cheese.price)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-3xl font-bold text-primary-600 dark:text-primary-500">
            {formatPrice(currentPrice)}
          </span>
        </div>

        <div className="space-y-2">
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

          <Link
            href={`/customize?pizzaId=${pizza.id}`}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Settings size={20} />
            Customize
          </Link>
        </div>
      </div>
    </div>
  );
}
