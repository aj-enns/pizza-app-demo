# Brian — History

## Learnings

- Added `'custom'` category to the `Pizza.category` type union in `lib/types.ts`
- Added "Build Your Own" custom pizza entry to `lib/data/menu.json` with $9.99 base price and empty `defaultToppings` — meaning all toppings selected are charged as extras
- Added `getMenuPizzas()` utility in `lib/utils.ts` that filters out custom pizzas from regular menu listing
- Updated `app/menu/page.tsx` to use `getMenuPizzas()` instead of `getPizzas()` so the custom pizza doesn't appear in the standard menu grid
- Verified `calculateItemPrice` handles empty `defaultToppings` correctly — `Array.filter` on an empty array works fine, all toppings become extras
- Kept `getPizzas()` unchanged so it still returns all pizzas including custom (needed for cart, API, etc.)

- Project is PizzaAppDemo — pizza ordering website built with Next.js 15, TypeScript, Tailwind CSS
- User: AJ Enns
- API routes at `app/api/menu/route.ts`, `app/api/orders/route.ts`, `app/api/orders/[id]/route.ts`
- Menu data: static JSON in `lib/data/menu.json`
- Orders: server-side JSON files in `data/orders/`
- Types defined in `lib/types.ts`: Pizza, Topping, CartItem, Order, CustomerInfo
- Utils in `lib/utils.ts`: formatPrice(), calculateItemPrice(), calculateCartTotals()
- API response format: `{ success: boolean, data?: T, error?: string }`
- Docker: multi-stage build, node:20-alpine, standalone output, port 3000
