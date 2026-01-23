import { getPizzas } from '@/lib/utils';
import PizzaCard from '@/components/PizzaCard';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export default function MenuPage() {
  const pizzas = getPizzas();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">Our Menu</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Discover our handcrafted pizzas made with premium ingredients and authentic Italian recipes
        </p>
      </div>

      {/* Build Your Own Card */}
      <div className="mb-8">
        <Link
          href="/customize?pizzaId=margherita"
          className="card overflow-hidden group animate-fade-in block hover:shadow-xl transition-shadow"
        >
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <ChefHat size={48} />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">Build Your Own Pizza</h2>
                <p className="text-lg text-primary-50">
                  Create your perfect pizza from scratch! Choose your crust, sauce, cheese, and toppings. 
                  Add toppings to the whole pizza or just half for a unique combination.
                </p>
              </div>
              <div className="text-xl font-semibold">
                Starting at $12.99
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pizzas.map((pizza) => (
          <PizzaCard key={pizza.id} pizza={pizza} />
        ))}
      </div>
    </div>
  );
}
