# Squad Decisions

## Active Decisions

### 2026-04-13: WCAG 2.1 AA Accessibility Audit — Combined Findings

**By:** Dom (Lead) + Mia (Frontend Dev)
**Requested by:** AJ Enns
**Scope:** Full-site WCAG 2.1 AA compliance audit (architectural + component-level)

After deduplication across both audits, the following unique findings were identified:

#### Critical (4)

| # | Finding | WCAG | File(s) | Recommendation |
|---|---------|------|---------|----------------|
| C1 | No skip link exists | 2.4.1 | `ClientLayout.tsx` | Add visually-hidden skip link before `<Header />`, add `id="main-content"` to `<main>` |
| C2 | Cart link has no accessible name | 2.4.4, 4.1.2 | `Header.tsx` | Add `aria-label` with dynamic item count |
| C3 | Checkout error not announced | 4.1.3 | `checkout/page.tsx` | Add `role="alert"` to error div |
| C4 | No `aria-live` regions anywhere in the app | 4.1.3 | Multiple | Implement live regions for cart updates, add-to-cart, form errors, loading states, order confirmation |

#### Serious (9)

| # | Finding | WCAG | File(s) | Recommendation |
|---|---------|------|---------|----------------|
| S1 | Homepage h3 before h2 in features section | 1.3.1 | `app/page.tsx` | Add h2 above features or change to h2 |
| S2 | Menu page h3 directly under h1 (skips h2) | 1.3.1 | `menu/page.tsx`, `PizzaCard.tsx` | Add grouping h2 or change PizzaCard heading level |
| S3 | All pages share same `<title>` | 2.4.2 | Multiple pages | Add page-specific metadata; client pages need layout.tsx wrappers |
| S4 | PizzaCard size selector lacks ARIA state | 4.1.2 | `PizzaCard.tsx` | Add `aria-pressed`, `role="group"` with `aria-label` |
| S5 | Add-to-cart "Added!" not in live region | 4.1.3 | `PizzaCard.tsx` | Add `role="status"` live region announcing addition |
| S6 | Cart count changes not announced | 4.1.3 | `Header.tsx`, `CartContext.tsx` | Add `aria-live="polite"` region for cart count |
| S7 | No `focus-visible` styles on custom buttons | 2.4.7 | `globals.css` | Add `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2` to `.btn-primary`, `.btn-secondary` |
| S8 | Checkout form missing `autocomplete` attributes | 1.3.5 | `checkout/page.tsx` | Add `autocomplete` values: name, email, tel, street-address, address-level2, postal-code |
| S9 | No per-field error association in checkout | 1.3.1, 3.3.1 | `checkout/page.tsx` | Add `aria-describedby` + `aria-invalid` for field-level errors |

#### Moderate (6)

| # | Finding | WCAG | File(s) | Recommendation |
|---|---------|------|---------|----------------|
| M1 | Header `<nav>` has no `aria-label` | 1.3.1 | `Header.tsx` | Add `aria-label="Main navigation"` |
| M2 | Footer Quick Links not wrapped in `<nav>` | 1.3.1 | `Footer.tsx` | Wrap in `<nav aria-label="Footer navigation">` |
| M3 | No `<fieldset>`/`<legend>` grouping in checkout | 1.3.1 | `checkout/page.tsx` | Group related fields semantically |
| M4 | No focus management after checkout redirect | 2.4.3 | `checkout/page.tsx`, `order-confirmation/page.tsx` | Set focus to h1 on confirmation page via ref + useEffect |
| M5 | ThemeToggle aria-label is static | 4.1.2 | `ThemeToggle.tsx` | Make dynamic: "Switch to dark/light mode" |
| M6 | Hero text contrast may fail 4.5:1 | 1.4.3 | `app/page.tsx` | Use `text-white` or `text-primary-50`, or increase size to qualify as large text |

#### Minor (4)

| # | Finding | WCAG | File(s) | Recommendation |
|---|---------|------|---------|----------------|
| m1 | Footer emojis read verbosely by screen readers | 1.3.1 | `Footer.tsx` | Wrap in `<span aria-hidden="true">` |
| m2 | Footer placeholder links (`href="#"`) | 2.4.4 | `Footer.tsx` | Implement pages or replace with `<span>` |
| m3 | Footer uses `<a>` instead of `<Link>` | N/A | `Footer.tsx` | Convert to Next.js `<Link>` for consistency |
| m4 | Required field `*` not explained | 1.3.1 | `checkout/page.tsx` | Add helper text or `aria-required="true"` |

#### What's Passing

Form labels, alt text on images, semantic landmarks (header/nav/main/footer), CartItem button aria-labels, `<html lang="en">`, responsive layout, color not sole indicator.

#### Recommended Sprint Plan

1. **Sprint 1 (Critical):** C1 skip link, C2 cart label, C3 error role, C4 live regions
2. **Sprint 2 (Serious):** S3 page titles, S1/S2 heading hierarchy, S8 autocomplete, S7 focus styles, S4 size ARIA
3. **Sprint 3 (Moderate):** M1/M2 nav labels, M3 fieldset, S5/S6 announcements, M4 focus management, loading spinners
4. **Sprint 4 (Minor):** m1 emojis, m2 placeholder links, m4 required explanation, M6 hero contrast verification

**Decision:** Site requires remediation across 4 sprints before WCAG 2.1 AA conformance. Assign to Mia (Frontend) for implementation, with Dom reviewing.

---

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
