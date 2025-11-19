import { getPizzas } from '@/lib/utils';
import PizzaCard from '@/components/PizzaCard';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pizzas.map((pizza) => (
          <PizzaCard key={pizza.id} pizza={pizza} />
        ))}
      </div>
    </div>
  );
}
