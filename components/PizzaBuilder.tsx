'use client';

import { useState, useMemo } from 'react';
import { PizzaSize } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import {
  SIZE_LABELS,
  formatPrice,
  calculateItemPrice,
  getToppings,
  getToppingById,
  getPizzaById,
} from '@/lib/utils';
import { Plus, Check } from 'lucide-react';

const TOPPING_CATEGORIES = [
  { key: 'cheese', label: 'Cheese' },
  { key: 'meat', label: 'Meat' },
  { key: 'vegetable', label: 'Vegetables' },
] as const;

const ALL_SIZES: PizzaSize[] = ['small', 'medium', 'large', 'xlarge'];

export default function PizzaBuilder() {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<PizzaSize>('medium');
  const [selectedSauce, setSelectedSauce] = useState<string>('tomato-sauce');
  const [selectedToppings, setSelectedToppings] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const allToppings = useMemo(() => getToppings(), []);

  const sauceOptions = useMemo(
    () => allToppings.filter((t) => t.category === 'sauce'),
    [allToppings]
  );

  const toppingsByCategory = useMemo(() => {
    const grouped: Record<string, typeof allToppings> = {};
    for (const cat of TOPPING_CATEGORIES) {
      grouped[cat.key] = allToppings.filter((t) => t.category === cat.key);
    }
    return grouped;
  }, [allToppings]);

  const customPizza = useMemo(() => getPizzaById('custom'), []);
  const sizeConfig = customPizza?.sizes.find((s) => s.size === selectedSize);

  // All toppings sent to cart = sauce + selected toppings
  const allSelectedToppings = useMemo(() => {
    return [selectedSauce, ...Array.from(selectedToppings)];
  }, [selectedSauce, selectedToppings]);

  const currentPrice = useMemo(() => {
    if (!customPizza || !sizeConfig) return 0;
    return calculateItemPrice(
      customPizza.basePrice,
      selectedSize,
      sizeConfig.priceMultiplier,
      allSelectedToppings,
      [] // custom pizza has no default toppings — everything adds cost
    );
  }, [customPizza, sizeConfig, selectedSize, allSelectedToppings]);

  const basePrice = useMemo(() => {
    if (!customPizza || !sizeConfig) return 0;
    return customPizza.basePrice * sizeConfig.priceMultiplier;
  }, [customPizza, sizeConfig]);

  function toggleTopping(id: string) {
    setSelectedToppings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleAddToCart() {
    if (!selectedSauce) return;
    setIsAdding(true);
    addItem('custom', selectedSize, allSelectedToppings);
    setTimeout(() => setIsAdding(false), 1000);
  }

  if (!customPizza) {
    return null;
  }

  return (
    <div
      data-testid="pizza-builder"
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up"
    >
      {/* Builder controls — left 2 cols */}
      <div className="lg:col-span-2 space-y-8">
        {/* Size Selector */}
        <section data-testid="size-selector" className="card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Choose Your Size
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ALL_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                  selectedSize === size
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {SIZE_LABELS[size]}
              </button>
            ))}
          </div>
        </section>

        {/* Sauce / Base Selector */}
        <section data-testid="sauce-selector" className="card p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Choose Your Base
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sauceOptions.map((sauce) => (
              <button
                key={sauce.id}
                onClick={() => setSelectedSauce(sauce.id)}
                className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  selectedSauce === sauce.id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                {sauce.name}
              </button>
            ))}
          </div>
        </section>

        {/* Toppings Selector */}
        <section data-testid="toppings-selector" className="card p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">
            Add Your Toppings
          </h2>

          {TOPPING_CATEGORIES.map((cat) => (
            <div key={cat.key} className="mb-6 last:mb-0">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                {cat.label}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {toppingsByCategory[cat.key]?.map((topping) => {
                  const isSelected = selectedToppings.has(topping.id);
                  return (
                    <button
                      key={topping.id}
                      onClick={() => toggleTopping(topping.id)}
                      className={`relative flex flex-col items-start p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 text-primary-600 dark:text-primary-400">
                          <Check size={16} />
                        </span>
                      )}
                      <span
                        className={`text-sm font-medium ${
                          isSelected
                            ? 'text-primary-700 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {topping.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {topping.price > 0 ? `+${formatPrice(topping.price)}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Price Preview — right col, sticky */}
      <div className="lg:col-span-1">
        <div
          data-testid="price-preview"
          className="card p-6 lg:sticky lg:top-24 space-y-4"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Your Pizza
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Base ({SIZE_LABELS[selectedSize]})</span>
              <span>{formatPrice(basePrice)}</span>
            </div>

            {/* Sauce line */}
            {selectedSauce && (
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{getToppingById(selectedSauce)?.name}</span>
                <span>
                  {(getToppingById(selectedSauce)?.price ?? 0) > 0
                    ? `+${formatPrice(getToppingById(selectedSauce)!.price)}`
                    : 'Free'}
                </span>
              </div>
            )}

            {/* Selected toppings lines */}
            {Array.from(selectedToppings).map((id) => {
              const t = getToppingById(id);
              if (!t) return null;
              return (
                <div
                  key={id}
                  className="flex justify-between text-gray-600 dark:text-gray-400"
                >
                  <span>{t.name}</span>
                  <span>
                    {t.price > 0 ? `+${formatPrice(t.price)}` : 'Free'}
                  </span>
                </div>
              );
            })}
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100">
            <span>Total</span>
            <span>{formatPrice(currentPrice)}</span>
          </div>

          <button
            data-testid="add-to-cart-builder"
            onClick={handleAddToCart}
            disabled={isAdding || !selectedSauce}
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
    </div>
  );
}
