# Tej — History

## Learnings

- Project is PizzaAppDemo — pizza ordering website built with Next.js 15, TypeScript, Tailwind CSS
- User: AJ Enns
- Unit tests: Jest 30 + React Testing Library, co-located in `__tests__/` directories
- E2E tests: Playwright in `e2e/`, Chromium only, 5 parallel workers
- E2E config: `fullyParallel: true`, retries: 2 in CI / 0 locally
- Web server auto-starts `npm run dev` for E2E, waits for localhost:3000
- Run unit tests: `npx jest`
- Run E2E: `npm run test:e2e`
- Full pipeline: `./runtests.ps1` (lint → tsc → build → Jest → Playwright)
- E2E must be parallel-safe: no shared state, use SPA navigation for stateful flows
- Use `{ exact: true }` for Playwright text matching

### Build Your Own Feature Tests (2026-04-29)
- Created `components/__tests__/PizzaBuilder.test.tsx` — 25 unit tests covering rendering, size/sauce/topping selection, price calculation, add-to-cart interaction, and edge cases
- Created `e2e/build-your-own.spec.ts` — 15 E2E tests covering page layout, defaults, size/sauce/topping selection, price updates, cart integration, persistence, navigation, stress test (all toppings), and full order flow
- Mocked `useCart` in unit tests to isolate PizzaBuilder from cart reducer logic; tested addItem args directly
- Used `data-testid` attributes for scoping selectors (pizza-builder, size-selector, sauce-selector, toppings-selector, price-preview, add-to-cart-builder)
- Used `within()` from RTL to scope queries inside testid containers — avoids strict-mode violations with duplicate text across sections
- Price calculations verified against known formula: basePrice × sizeMultiplier + sum(topping prices), where all toppings cost (defaultToppings is empty for custom pizza)
- E2E full flow test covers: build pizza → add to cart → cart verification → checkout → order confirmation
- Stress test selects every available topping and verifies total: $40.99 for medium with all toppings
