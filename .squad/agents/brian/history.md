# Brian — History

## Learnings

- Project is PizzaAppDemo — pizza ordering website built with Next.js 15, TypeScript, Tailwind CSS
- User: AJ Enns
- API routes at `app/api/menu/route.ts`, `app/api/orders/route.ts`, `app/api/orders/[id]/route.ts`
- Menu data: static JSON in `lib/data/menu.json`
- Orders: server-side JSON files in `data/orders/`
- Types defined in `lib/types.ts`: Pizza, Topping, CartItem, Order, CustomerInfo
- Utils in `lib/utils.ts`: formatPrice(), calculateItemPrice(), calculateCartTotals()
- API response format: `{ success: boolean, data?: T, error?: string }`
- Docker: multi-stage build, node:20-alpine, standalone output, port 3000
