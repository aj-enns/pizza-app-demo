# Decision: Custom Pizza Data Model Support

**Author:** Brian (Backend Dev)  
**Date:** 2026-04-29  
**Status:** Implemented  

## Summary

Added data model support for a "Build Your Own" custom pizza feature.

## Changes

1. **Added `'custom'` category to `Pizza` type** (`lib/types.ts`)  
   Extended the category union from `'classic' | 'specialty' | 'vegetarian' | 'premium'` to include `'custom'`.

2. **Added custom pizza entry to `menu.json`** (`lib/data/menu.json`)  
   - ID: `custom`
   - Base price: $9.99 (lowest on the menu — it's a blank canvas)
   - Empty `defaultToppings` array, so all selected toppings are charged as extras
   - All four sizes supported with standard multipliers

3. **Added `getMenuPizzas()` utility** (`lib/utils.ts`)  
   - Filters out pizzas with `category === 'custom'` from the regular menu listing
   - `getPizzas()` remains unchanged and returns all pizzas (needed by cart, API, etc.)

4. **Updated menu page** (`app/menu/page.tsx`)  
   - Switched from `getPizzas()` to `getMenuPizzas()` so the custom pizza doesn't appear in the standard menu grid
   - The custom pizza will be accessed via a dedicated "Build Your Own" page/flow (future work)

## Rationale

- Empty `defaultToppings` is intentional: `calculateItemPrice()` correctly treats all toppings as extras when the default array is empty
- Filtering at the utility layer (`getMenuPizzas()`) keeps the menu page clean and makes the filter reusable
- Keeping `getPizzas()` inclusive ensures the custom pizza is still accessible for cart operations and API responses
