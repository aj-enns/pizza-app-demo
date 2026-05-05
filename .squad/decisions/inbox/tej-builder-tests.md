# Decision: Build Your Own Pizza — Test Coverage

**Author:** Tej (Tester)  
**Date:** 2026-04-29  
**Status:** Proposed  

## Context

The Build Your Own pizza feature is being added by Brian (data) and Mia (UI). Tests need to cover the PizzaBuilder component and the `/build-your-own` page end-to-end before merging.

## Decision

### Unit Tests (`components/__tests__/PizzaBuilder.test.tsx`) — 25 tests

| Category | Count | Coverage |
|---|---|---|
| Rendering & layout | 2 | All sections render, add-to-cart button present |
| Size selector | 4 | All 4 sizes render, default medium, selection change, price update |
| Sauce selector | 3 | All 3 sauces render, default tomato, selection change |
| Toppings selector | 7 | Category grouping, toggle on/off, price add/remove, multi-topping math, topping prices displayed |
| Price calculation | 2 | Size + toppings combined, xlarge pricing |
| Add to cart | 5 | Correct addItem args (default, with toppings, with size change), confirmation text, button disable |
| Edge cases | 2 | Base price only (no toppings), sauce swap with no price impact, free cheese topping |

**Key testing decisions:**
- Mocked `useCart` to isolate component from reducer logic. Unit tests verify that `addItem` is called with `('custom', size, toppings[])`.
- Used `within()` scoped to `data-testid` containers to avoid strict-mode selector collisions.
- Price assertions use exact dollar amounts calculated from known formula.

### E2E Tests (`e2e/build-your-own.spec.ts`) — 15 tests

| Category | Count | Coverage |
|---|---|---|
| Page layout | 1 | All sections visible |
| Default state | 2 | Medium + tomato sauce selected, base price shown |
| Size selection | 1 | All 4 sizes with correct prices |
| Sauce selection | 1 | Swap sauces, verify selection state |
| Toppings | 3 | Category grouping, toggle on/off, price updates with add/remove |
| Multi-topping price | 1 | 4 toppings selected, correct total |
| Cart integration | 2 | Add to cart, show in cart page; confirmation + button disable |
| Navigation | 1 | Header link to /build-your-own |
| Persistence | 1 | Cart survives page refresh |
| Stress test | 1 | All toppings selected, total = $40.99 |
| Size + toppings combo | 1 | Large with chicken, then switch to small |
| Full order flow | 1 | Build → cart → checkout → confirmation |

**Parallel safety:** All tests use `test.beforeEach` with `page.goto('/build-your-own')`. Cart integration tests navigate through the app via header links. No shared mutable state between tests.

## Risks

- Tests are written against Mia's planned `data-testid` attributes and CSS class conventions (`border-primary-600` for selected state). If implementation differs, tests will need adjustment.
- The stress test price ($40.99) assumes the current topping catalog stays unchanged; any new toppings or price changes will break this assertion.
