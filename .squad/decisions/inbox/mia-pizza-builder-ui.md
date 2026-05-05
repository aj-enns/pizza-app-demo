# Decision: Build Your Own Pizza — UI Structure

**Author:** Mia (Frontend Dev)  
**Date:** 2026-04-29  
**Status:** Implemented

## What Was Built

- **Page:** `app/build-your-own/page.tsx` — Client Component with hero section and `PizzaBuilder`
- **Component:** `components/PizzaBuilder.tsx` — Full pizza customization flow
- **Header update:** Added "Build Your Own" nav link between Menu and cart icon

## UI Flow

1. **Size selector** — 4 buttons (Small/Medium/Large/X-Large), defaults to Medium
2. **Sauce selector** — Single-select from sauce-category toppings, defaults to Tomato Sauce
3. **Toppings selector** — Multi-select grouped by category (Cheese, Meat, Vegetables) with checkmarks
4. **Price preview** — Sticky sidebar showing real-time price breakdown and total
5. **Add to Cart** — Uses `addItem('custom', size, [sauce, ...toppings])`, 1-second "Added!" confirmation

## Key Decisions

- Sauce is mandatory and single-select (pick ONE base), separate from the multi-select toppings grid
- Used `Set<string>` for topping state — O(1) toggle vs array filter
- Price preview is sticky on desktop (`lg:sticky lg:top-24`) so it's always visible while scrolling toppings
- Reused PizzaCard's border-2/primary color pattern for selected states for visual consistency
- All selected toppings cost extra since custom pizza has `defaultToppings: []`
- Component returns `null` if `getPizzaById('custom')` is undefined (safety for Brian's data dependency)

## Test IDs

`pizza-builder`, `size-selector`, `sauce-selector`, `toppings-selector`, `price-preview`, `add-to-cart-builder`
