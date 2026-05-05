'use client';

import PizzaBuilder from '@/components/PizzaBuilder';
import { ChefHat } from 'lucide-react';

export default function BuildYourOwnPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12 animate-fade-in">
        <div className="flex justify-center mb-4">
          <ChefHat size={48} className="text-primary-600 dark:text-primary-500" />
        </div>
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Build Your Own Pizza
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Craft your perfect pizza from scratch — pick your size, choose a sauce, and load up on toppings
        </p>
      </div>

      <PizzaBuilder />
    </div>
  );
}
