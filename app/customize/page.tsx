import { notFound } from 'next/navigation';
import PizzaCustomizer from '@/components/PizzaCustomizer';
import { getPizzaById, getToppings, getCrusts } from '@/lib/utils';

interface CustomizePageProps {
  searchParams: { pizzaId?: string };
}

export default function CustomizePage({ searchParams }: CustomizePageProps) {
  const pizzaId = searchParams.pizzaId;
  
  if (!pizzaId) {
    notFound();
  }
  
  const pizza = getPizzaById(pizzaId);
  
  if (!pizza) {
    notFound();
  }
  
  const allToppings = getToppings();
  const allCrusts = getCrusts();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <PizzaCustomizer 
          pizza={pizza} 
          allToppings={allToppings}
          allCrusts={allCrusts}
        />
      </div>
    </div>
  );
}
