# Mia — History

## Learnings

- Project is PizzaAppDemo — pizza ordering website built with Next.js 15, TypeScript, Tailwind CSS
- User: AJ Enns
- Components: Header, Footer, PizzaCard, CartItem, CartSummary, ThemeToggle, ClientLayout
- Pages: home (`app/page.tsx`), menu, cart, checkout, order-confirmation, changelog
- Cart state: React Context + useReducer in `contexts/CartContext.tsx`, persisted to localStorage
- Theme context in `contexts/ThemeContext.tsx`
- Custom Tailwind classes: `.btn-primary`, `.btn-secondary`, `.card`, `.input-field`
- Custom colors: `primary-{50-900}` (red/pizza theme)
- Animations: `animate-fade-in`, `animate-slide-up`
- Responsive: mobile-first with `md:`, `lg:` breakpoints
- Icons: Lucide React

### WCAG 2.1 AA Audit (2026-04-13)
- **Critical:** Header cart link (`components/Header.tsx`) has no accessible name — icon-only link with no aria-label
- **Serious:** No live-region announcements for add-to-cart, checkout errors, or cart count changes
- **Serious:** PizzaCard size selector buttons lack `aria-pressed` / group role for selected state
- **Serious:** `.btn-primary` and `.btn-secondary` have no focus ring styles — only hover states defined
- **Serious:** Checkout error message div missing `role="alert"`; no per-field `aria-describedby` for inline errors
- **Moderate:** ThemeToggle `aria-label` is static ("Toggle theme") — should be dynamic per current state
- **Moderate:** Hero section primary-100 text on primary-600+ gradient may fail 4.5:1 contrast for normal text
- **Good:** Form labels, alt text on images, semantic landmarks, heading hierarchy, CartItem button aria-labels all pass
- Full audit written to `.squad/decisions/inbox/mia-wcag-audit.md`
