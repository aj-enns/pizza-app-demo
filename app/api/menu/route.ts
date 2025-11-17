import { NextResponse } from 'next/server';
import { getPizzas, getToppings } from '@/lib/utils';
import { trackPerformance, PERFORMANCE_THRESHOLDS } from '@/lib/performance';

export async function GET() {
  return trackPerformance(
    'API:GET:/api/menu',
    async () => {
      try {
        const pizzas = getPizzas();
        const toppings = getToppings();
    
    return NextResponse.json({
      success: true,
      data: {
        pizzas,
        toppings,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch menu data',
      },
      { status: 500 }
    );
      }
    },
    PERFORMANCE_THRESHOLDS.API_REQUEST,
    { endpoint: '/api/menu' }
  );
}
