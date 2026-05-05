# WCAG 2.1 AA Accessibility Testing Plan — PizzaHub

## Executive Summary

This document defines a comprehensive accessibility testing strategy for the PizzaHub pizza ordering website, targeting **WCAG 2.1 Level AA** conformance. The application is built with Next.js 15 (App Router), TypeScript, and Tailwind CSS, and includes pages for browsing a menu, managing a shopping cart, completing checkout, and viewing order confirmations.

### Scope

The testing covers all user-facing pages:

| Page | Route | Component Type |
|------|-------|---------------|
| Homepage | `/` | Server Component |
| Menu | `/menu` | Server Component with client PizzaCard |
| Cart | `/cart` | Client Component |
| Checkout | `/checkout` | Client Component (form) |
| Order Confirmation | `/order-confirmation` | Client Component |
| Changelog | `/changelog` | Server Component |

### Approach

Testing is implemented as **Playwright E2E tests** using two complementary techniques:

1. **Automated axe-core scans** — Using `@axe-core/playwright` to programmatically detect accessibility violations on each page. This covers machine-detectable criteria like missing alt text, color contrast, ARIA roles, form labels, landmark regions, and heading hierarchy.

2. **Custom Playwright assertions** — For criteria that axe-core cannot fully automate (keyboard navigation, focus management, focus visibility, reflow behavior, text spacing resilience, skip links, etc.), we write targeted Playwright tests that simulate real user interactions.

### Tooling

| Tool | Purpose |
|------|---------|
| `@axe-core/playwright` | Automated accessibility scanning per page |
| `@playwright/test` | Test framework, assertions, browser automation |
| Chromium | Browser under test |

### Reporting

When a test fails, the Playwright report will include:
- **File**: The spec file containing the failing test (e.g., `e2e/wcag-accessibility.spec.ts`)
- **Line number**: The assertion line that failed
- **Reason**: The specific WCAG criterion violated, with axe-core rule ID and description
- **Remediation**: Suggested fix based on the violation details (axe-core provides `help` and `helpUrl` for each violation)

Axe-core violations are formatted in the error message to show:
```
WCAG Violation: [rule-id]
  Impact: [critical|serious|moderate|minor]
  Description: [what is wrong]
  Help: [how to fix it]
  Help URL: [link to detailed docs]
  Affected nodes:
    - [CSS selector] — [failure summary]
```

---

## Testing Strategy

### Phase 1: Install Dependencies

Install `@axe-core/playwright` as a dev dependency:
```bash
npm install --save-dev @axe-core/playwright
```

### Phase 2: Create Test File

Create `e2e/wcag-accessibility.spec.ts` containing all WCAG 2.1 AA test cases, grouped by WCAG principle and guideline.

### Phase 3: Run & Report

Run tests:
```bash
npx playwright test e2e/wcag-accessibility.spec.ts
```

View HTML report with pass/fail details:
```bash
npx playwright show-report
```

---

## Detailed Test Plan

Tests are organized by WCAG principle → guideline → success criterion. Each test case includes the WCAG reference, what is tested, and how.

### 1. Perceivable

#### 1.1.1 Non-text Content (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.1.1-a | All images have alt text or are decorative (`alt=""`) | axe-core rule: `image-alt` | All |
| 1.1.1-b | All linked images have descriptive alt text | axe-core rule: `image-alt`, `link-name` | All |
| 1.1.1-c | Form buttons have descriptive text/value | axe-core rule: `button-name` | Cart, Checkout |
| 1.1.1-d | Inputs have accessible names | axe-core rule: `label`, `input-image-alt` | Checkout |

#### 1.3.1 Info and Relationships (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.3.1-a | Headings use proper semantic markup (h1-h6) | axe-core: `heading-order`, `empty-heading` | All |
| 1.3.1-b | Page landmarks/regions are defined | axe-core: `region`, `landmark-*` | All |
| 1.3.1-c | Form labels are associated with inputs | axe-core: `label` | Checkout |
| 1.3.1-d | Lists use proper `<ul>`/`<ol>`/`<li>` markup | axe-core: `list`, `listitem` | All |

#### 1.3.2 Meaningful Sequence (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.3.2-a | DOM order matches visual presentation | Custom: tab through page, verify focus order matches layout | All |

#### 1.3.4 Orientation (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.3.4-a | Content renders in both portrait and landscape viewports | Custom: test at 800×600 and 600×800 viewports | Homepage, Menu |

#### 1.3.5 Identify Input Purpose (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.3.5-a | Checkout form fields have `autocomplete` attributes | Custom: check `autocomplete` attribute on name, email, phone, address, city, zip fields | Checkout |

#### 1.4.1 Use of Color (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.4.1-a | Color is not the sole method of conveying information | axe-core: `color-contrast` + manual validation | All |

#### 1.4.3 Contrast (Minimum) (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.4.3-a | Text meets 4.5:1 contrast ratio | axe-core: `color-contrast` | All |
| 1.4.3-b | Large text meets 3:1 contrast ratio | axe-core: `color-contrast` | All |

#### 1.4.4 Resize Text (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.4.4-a | Page is functional at 200% zoom | Custom: set viewport to 640×360 (simulating 200% zoom of 1280×720) and verify key content visible | Homepage, Menu, Cart |

#### 1.4.10 Reflow (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.4.10-a | No horizontal scrolling at 320px width | Custom: set viewport width to 320px, verify no horizontal overflow | All |

#### 1.4.11 Non-text Contrast (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.4.11-a | UI components and graphical objects have 3:1 contrast | axe-core rules (partial) + visual review | Buttons, form inputs |

#### 1.4.12 Text Spacing (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.4.12-a | No content loss when text spacing is increased | Custom: inject CSS to increase spacing, verify no overflow/clipping | Homepage, Menu |

#### 1.4.13 Content on Hover or Focus (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 1.4.13-a | Hover/focus content is dismissible and persistent | Custom: test tooltip/popover behavior if present | All (verify no violations) |

### 2. Operable

#### 2.1.1 Keyboard (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.1.1-a | All interactive elements are keyboard accessible | Custom: Tab to every link, button, and form control | All |
| 2.1.1-b | Size selector buttons are keyboard operable | Custom: Tab to size buttons and press Enter/Space | Menu |
| 2.1.1-c | Add to Cart buttons are keyboard operable | Custom: Tab and activate | Menu |
| 2.1.1-d | Cart quantity controls are keyboard operable | Custom: Tab and activate +/- buttons | Cart |
| 2.1.1-e | Checkout form can be completed with keyboard only | Custom: Tab through fields, submit with Enter | Checkout |

#### 2.1.2 No Keyboard Trap (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.1.2-a | User can Tab forward and Shift+Tab backward through all elements | Custom: Tab through entire page and back | All |

#### 2.4.1 Bypass Blocks (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.4.1-a | Skip navigation link is present and functional | Custom: Tab once from page top, verify skip link appears | All |
| 2.4.1-b | Page has landmark regions (header, main, footer) | axe-core: `landmark-one-main`, `region` | All |

#### 2.4.2 Page Titled (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.4.2-a | Each page has a descriptive `<title>` | Custom: check `document.title` on each page | All |

#### 2.4.3 Focus Order (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.4.3-a | Tab order follows logical reading order | Custom: Tab through page, verify sequence matches visual layout | All |

#### 2.4.4 Link Purpose (In Context) (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.4.4-a | All links have descriptive text or aria-label | axe-core: `link-name` | All |

#### 2.4.5 Multiple Ways (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.4.5-a | Site has navigation links (header) and footer links to find pages | Custom: verify header nav and footer quick links exist | All |

#### 2.4.6 Headings and Labels (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.4.6-a | Headings are informative and properly structured | axe-core: `heading-order`, `empty-heading` | All |
| 2.4.6-b | Form labels are descriptive | Custom: verify label text matches field purpose | Checkout |

#### 2.4.7 Focus Visible (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 2.4.7-a | All interactive elements have visible focus indicators | Custom: Tab to elements, verify `outline` or visible border change | All |

### 3. Understandable

#### 3.1.1 Language of Page (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.1.1-a | `<html>` element has `lang` attribute | axe-core: `html-has-lang`, `html-lang-valid` | All |

#### 3.1.2 Language of Parts (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.1.2-a | Content in other languages has appropriate `lang` attribute | Manual review (not applicable — app is English only) | N/A |

#### 3.2.1 On Focus (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.2.1-a | No context change on focus | Custom: Tab through form fields, verify no unexpected navigation or popups | Checkout |

#### 3.2.2 On Input (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.2.2-a | No unexpected context changes when typing in form fields | Custom: type in checkout fields, verify no unexpected page changes | Checkout |

#### 3.2.3 Consistent Navigation (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.2.3-a | Header navigation order is consistent across pages | Custom: compare nav link order on homepage, menu, cart | All |

#### 3.2.4 Consistent Identification (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.2.4-a | Same functionality uses same labels across pages | Custom: verify "Menu", "Cart" links have same text on all pages | All |

#### 3.3.1 Error Identification (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.3.1-a | Required fields are indicated in labels | Custom: verify required indicator (*) in labels | Checkout |
| 3.3.1-b | Validation errors are displayed accessibly | Custom: submit empty form, verify error messages appear | Checkout |

#### 3.3.2 Labels or Instructions (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.3.2-a | All form inputs have visible labels | Custom: verify label elements for all inputs | Checkout |

#### 3.3.3 Error Suggestion (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.3.3-a | Error messages suggest how to fix the issue | Custom: trigger validation, verify helpful error text | Checkout |

#### 3.3.4 Error Prevention (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 3.3.4-a | Order placement can be reviewed before submission | Custom: verify cart summary visible on checkout | Checkout |

### 4. Robust

#### 4.1.2 Name, Role, Value (Level A)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 4.1.2-a | Interactive elements have proper ARIA roles | axe-core: `aria-*` rules | All |
| 4.1.2-b | Custom controls have appropriate roles and states | axe-core + Custom: verify cart badge, theme toggle | Header |

#### 4.1.3 Status Messages (Level AA)
| # | Test Case | Method | Pages |
|---|-----------|--------|-------|
| 4.1.3-a | "Added to cart" feedback is announced to screen readers | Custom: verify `role="status"` or `aria-live` region for cart feedback | Menu |
| 4.1.3-b | Form error messages use `role="alert"` or `aria-live` | Custom: verify error container has appropriate ARIA | Checkout |

---

## Implementation File Structure

```
e2e/
└── wcag-accessibility.spec.ts    # All WCAG 2.1 AA Playwright tests
```

The test file is organized with `test.describe` blocks matching the WCAG principle groupings:
- `1. Perceivable`
- `2. Operable`
- `3. Understandable`
- `4. Robust`

Each `test.describe` block contains sub-groups for each guideline with individual test cases.

---

## Test Execution

```bash
# Install axe-core
npm install --save-dev @axe-core/playwright

# Run WCAG tests only
npx playwright test e2e/wcag-accessibility.spec.ts

# Run with visible browser
npx playwright test e2e/wcag-accessibility.spec.ts --headed

# View HTML report
npx playwright show-report
```

---

## Failure Report Format

Each test failure in the Playwright HTML report includes:

1. **Test name**: Descriptive name referencing the WCAG criterion (e.g., "1.4.3 — should have sufficient color contrast on all pages")
2. **File and line**: `e2e/wcag-accessibility.spec.ts:L42`
3. **Error message**: For axe-core tests, a formatted list of all violations including:
   - Rule ID and impact level
   - Description and help text
   - URL to detailed documentation
   - CSS selectors of affected elements
   - Remediation summary
4. **Screenshot**: Captured automatically on failure (Playwright config)
5. **Trace**: Available on first retry (Playwright config)
