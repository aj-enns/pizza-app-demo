'use client';

import { useState, useMemo } from 'react';
import { Pizza, PizzaSize, Topping, ToppingPlacement, ToppingWithPlacement, Crust } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { SIZE_LABELS, formatPrice, calculateCustomItemPrice, getToppingById, getCrustById } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';

interface PizzaCustomizerProps {
  pizza: Pizza;
  allToppings: Topping[];
  allCrusts: Crust[];
  onClose?: () => void;
}

export default function PizzaCustomizer({ pizza, allToppings, allCrusts, onClose }: PizzaCustomizerProps) {
  const { addCustomItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('medium');
  const [selectedCrust, setSelectedCrust] = useState<string>('regular');
  const [selectedSauce, setSelectedSauce] = useState<string>(
    pizza.defaultToppings.find(t => {
      const topping = getToppingById(t);
      return topping?.category === 'sauce';
    }) || 'tomato-sauce'
  );
  const [customToppings, setCustomToppings] = useState<ToppingWithPlacement[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Get sauces and non-sauce toppings
  const sauces = useMemo(() => allToppings.filter(t => t.category === 'sauce'), [allToppings]);
  const nonSauceToppings = useMemo(() => allToppings.filter(t => t.category !== 'sauce'), [allToppings]);

  // Group toppings by category
  const toppingsByCategory = useMemo(() => {
    const grouped: Record<string, Topping[]> = {};
    nonSauceToppings.forEach(topping => {
      if (!grouped[topping.category]) {
        grouped[topping.category] = [];
      }
      grouped[topping.category].push(topping);
    });
    return grouped;
  }, [nonSauceToppings]);

  // Calculate current price
  const sizeConfig = pizza.sizes.find(s => s.size === selectedSize);
  const currentPrice = useMemo(() => {
    if (!sizeConfig) return pizza.basePrice;
    
    // Add sauce to custom toppings for price calculation
    const toppingsWithSauce = [
      ...customToppings,
      { toppingId: selectedSauce, placement: 'full' as ToppingPlacement }
    ];
    
    return calculateCustomItemPrice(
      pizza.basePrice,
      selectedSize,
      sizeConfig.priceMultiplier,
      toppingsWithSauce,
      pizza.defaultToppings,
      selectedCrust
    );
  }, [pizza, selectedSize, selectedCrust, selectedSauce, customToppings, sizeConfig]);

  const handleToppingClick = (toppingId: string, placement: ToppingPlacement) => {
    setCustomToppings(prev => {
      // Check if this exact topping+placement combo exists
      const existingIndex = prev.findIndex(
        t => t.toppingId === toppingId && t.placement === placement
      );

      if (existingIndex >= 0) {
        // Remove it
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        // Add it
        return [...prev, { toppingId, placement }];
      }
    });
  };

  const getToppingStatus = (toppingId: string, placement: ToppingPlacement): boolean => {
    return customToppings.some(t => t.toppingId === toppingId && t.placement === placement);
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    
    // Add sauce to custom toppings
    const finalToppings = [
      ...customToppings,
      { toppingId: selectedSauce, placement: 'full' as ToppingPlacement }
    ];
    
    addCustomItem(
      pizza.id,
      `Custom ${pizza.name}`,
      selectedSize,
      finalToppings,
      selectedCrust,
      selectedSauce
    );
    
    setTimeout(() => {
      setIsAdding(false);
      if (onClose) {
        onClose();
      }
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          Customize Your Pizza
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Build your perfect pizza with our fresh ingredients
        </p>
      </div>

      {/* Size Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Choose Size
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pizza.sizes.map(({ size }) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                selectedSize === size
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              {SIZE_LABELS[size]}
            </button>
          ))}
        </div>
      </div>

      {/* Crust Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Choose Crust
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allCrusts.map(crust => (
            <button
              key={crust.id}
              onClick={() => setSelectedCrust(crust.id)}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                selectedCrust === crust.id
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="font-medium">{crust.name}</div>
              {crust.price > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  +{formatPrice(crust.price)}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sauce Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Choose Sauce
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sauces.map(sauce => (
            <button
              key={sauce.id}
              onClick={() => setSelectedSauce(sauce.id)}
              className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                selectedSauce === sauce.id
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="font-medium">{sauce.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Toppings Selection */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Add Toppings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Click once for whole pizza, twice for left half, three times for right half, four times to remove
        </p>

        {Object.entries(toppingsByCategory).map(([category, toppings]) => (
          <div key={category} className="mb-6">
            <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200 capitalize">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {toppings.map(topping => {
                const isFullSelected = getToppingStatus(topping.id, 'full');
                const isLeftSelected = getToppingStatus(topping.id, 'left');
                const isRightSelected = getToppingStatus(topping.id, 'right');
                const hasSelection = isFullSelected || isLeftSelected || isRightSelected;

                return (
                  <div
                    key={topping.id}
                    className={`border-2 rounded-lg overflow-hidden transition-all ${
                      hasSelection
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {topping.name}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {topping.price > 0 ? `+${formatPrice(topping.price)}` : 'Free'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleToppingClick(topping.id, 'full')}
                          className={`px-2 py-1 text-xs rounded border transition-all ${
                            isFullSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-600'
                          }`}
                        >
                          Whole
                        </button>
                        <button
                          onClick={() => handleToppingClick(topping.id, 'left')}
                          className={`px-2 py-1 text-xs rounded border transition-all ${
                            isLeftSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-600'
                          }`}
                        >
                          Left
                        </button>
                        <button
                          onClick={() => handleToppingClick(topping.id, 'right')}
                          className={`px-2 py-1 text-xs rounded border transition-all ${
                            isRightSelected
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-primary-600'
                          }`}
                        >
                          Right
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add to Cart Section */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 p-6 -mx-4 md:mx-0 md:rounded-lg md:border-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Price</div>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-500">
              {formatPrice(currentPrice)}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="btn-primary flex items-center gap-2 px-8 py-4 text-lg"
          >
            {isAdding ? (
              <>
                <Check size={24} />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart size={24} />
                Add to Cart
              </>
            )}
          </button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {customToppings.length > 0 && (
            <span>
              {customToppings.length} custom topping{customToppings.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
