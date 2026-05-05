# Dom — History

## Learnings

- Project is PizzaAppDemo — pizza ordering website built with Next.js 15, TypeScript, Tailwind CSS
- User: AJ Enns
- App Router architecture with Server Components by default, Client Components marked with 'use client'
- Cart state managed via React Context + useReducer in `contexts/CartContext.tsx`
- API routes in `app/api/` using Next.js Route Handlers
- Menu data is static JSON in `lib/data/menu.json`
- Orders persisted as JSON files in `data/orders/`
- Price calculations in `lib/utils.ts` (tax: 8%, delivery: $4.99)
- Unit tests: Jest 30 + React Testing Library
- E2E tests: Playwright (Chromium, 5 parallel workers)

### WCAG 2.1 AA Audit (2026-04-13)
- Site has zero `aria-live` regions — all dynamic status changes invisible to screen readers
- No skip link exists — critical WCAG 2.4.1 violation
- Cart icon link in Header has no aria-label — screen readers can't determine purpose
- Checkout error div lacks `role="alert"` — form errors not announced
- Heading hierarchy broken on homepage (h3 before h2 in features section) and menu (h3 directly under h1)
- All pages share same `<title>` — no page-specific titles (client component pages can't export Next.js metadata)
- PizzaCard size selector lacks `aria-pressed` — selected state not conveyed to AT
- Checkout form missing `autocomplete` attributes on all fields (1.3.5)
- No explicit `focus-visible` styles on custom button/input classes in globals.css
- Footer has contrast concern: `dark:text-gray-500` on `gray-950` may fail 4.5:1
- Footer emojis read verbosely by screen readers — need `aria-hidden`
- Existing WCAG testing plan in `WCAG-2.1-AA/wcagtesting.md` covers test strategy with axe-core + Playwright
- 22 total findings: 4 critical, 9 serious, 6 moderate, 3 minor
