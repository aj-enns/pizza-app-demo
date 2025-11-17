# GitHub Copilot Instructions - Pizza Ordering Website

## Project Overview
This is a modern, full-stack pizza ordering website built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and Docker. The application features a complete e-commerce flow: menu browsing, shopping cart management, checkout process, and order confirmation.

## Tech Stack & Architecture

### Core Technologies
- **Framework**: Next.js 15 with App Router (not Pages Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS with custom theme and animations
- **State Management**: React Context API (no external state libraries)
- **Icons**: Lucide React
- **Deployment**: Docker with multi-stage builds

### Architecture Pattern
- **Client-Server**: Uses Next.js App Router with Server Components by default
- **Client Components**: Marked with `'use client'` directive for interactivity (cart, forms, etc.)
- **API Routes**: Located in `app/api/` directory using Route Handlers
- **Data Storage**: 
  - Static menu data: JSON file (`lib/data/menu.json`)
  - Cart data: Browser localStorage (managed by Context API)
  - Orders: Server-side JSON files in `data/orders/` directory

## Project Structure

```
app/                          # Next.js app directory (App Router)
├── api/                      # API route handlers
│   ├── menu/route.ts         # GET menu data
│   └── orders/
│       ├── route.ts          # POST create order, GET orders list
│       └── [id]/route.ts     # GET single order by ID
├── cart/page.tsx             # Shopping cart page (Client Component)
├── checkout/page.tsx         # Checkout form (Client Component)
├── menu/page.tsx             # Menu listing (Server Component)
├── order-confirmation/page.tsx # Order success page (Client Component)
├── layout.tsx                # Root layout with CartProvider
├── page.tsx                  # Homepage/landing page
└── globals.css               # Tailwind base styles + custom utilities

components/                   # Reusable UI components
├── Header.tsx                # Navigation with cart badge (Client Component)
├── Footer.tsx                # Site footer (Server Component)
├── PizzaCard.tsx             # Pizza display card with size selector (Client Component)
├── CartItem.tsx              # Cart item with quantity controls (Client Component)
└── CartSummary.tsx           # Order totals summary (Client Component)

contexts/
└── CartContext.tsx           # Shopping cart state management (React Context + useReducer)

lib/
├── types.ts                  # TypeScript interfaces and types
├── utils.ts                  # Helper functions (price calc, formatting, etc.)
└── data/menu.json            # Pizza and topping definitions

data/orders/                  # Runtime order storage (JSON files)
```

## Code Style & Conventions

### TypeScript
- Use strict TypeScript with proper typing
- Define interfaces in `lib/types.ts` for reusability
- Use type imports: `import type { Type } from '@/lib/types'`
- No `any` types - use proper interfaces or `unknown` with type guards

### React Components
- **Server Components**: Default for all components unless interactivity needed
- **Client Components**: Use `'use client'` directive at the top when needed for:
  - State management (`useState`, `useReducer`, `useContext`)
  - Event handlers (`onClick`, `onChange`, etc.)
  - Browser APIs (`localStorage`, `window`, etc.)
  - React hooks that require client-side execution
- Functional components with TypeScript interfaces for props
- Use `export default function ComponentName()` pattern

### Styling
- Use Tailwind CSS utility classes exclusively
- Custom utilities defined in `globals.css`:
  - `.btn-primary` - Primary action buttons
  - `.btn-secondary` - Secondary action buttons
  - `.card` - Card container with shadow
  - `.input-field` - Form input styling
- Custom color theme: `primary-{50-900}` (red/pizza theme)
- Custom animations: `animate-fade-in`, `animate-slide-up`
- Responsive design: Mobile-first approach with `md:`, `lg:` breakpoints

### File Organization
- Use `@/` path alias for imports (configured in `tsconfig.json`)
- Group related files by feature (e.g., `app/checkout/`, `app/menu/`)
- Keep components small and focused on single responsibility
- Extract reusable logic to `lib/utils.ts`

### Naming Standards

#### File Naming
- **Components**: PascalCase (e.g., `PizzaCard.tsx`, `CartItem.tsx`, `Header.tsx`)
- **Pages**: lowercase with hyphens for routes (e.g., `page.tsx`, `order-confirmation/page.tsx`)
- **API Routes**: lowercase (e.g., `route.ts`, `[id]/route.ts`)
- **Utilities**: camelCase (e.g., `utils.ts`, `types.ts`)
- **Data files**: lowercase with hyphens (e.g., `menu.json`)
- **Config files**: lowercase with dots (e.g., `next.config.js`, `tailwind.config.ts`)

#### Variable & Function Naming
- **Variables**: camelCase (e.g., `cartItems`, `totalPrice`, `orderNumber`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `STORAGE_KEY`, `DATA_DIR`, `SIZE_LABELS`)
- **Functions**: camelCase with verb prefixes (e.g., `getPizzas()`, `calculateItemPrice()`, `formatPrice()`)
- **React Components**: PascalCase (e.g., `function PizzaCard()`, `function CartSummary()`)
- **Custom Hooks**: camelCase starting with "use" (e.g., `useCart()`)
- **Event Handlers**: camelCase with "handle" prefix (e.g., `handleSubmit`, `handleAddToCart`, `handleChange`)

#### Type & Interface Naming
- **Interfaces**: PascalCase (e.g., `Pizza`, `CartItem`, `Order`, `CustomerInfo`)
- **Type Aliases**: PascalCase (e.g., `PizzaSize`, `ApiResponse<T>`)
- **Enums**: PascalCase with UPPER_CASE values (e.g., `OrderStatus`)
- **Generic Types**: Single uppercase letter or descriptive (e.g., `T`, `TData`, `ApiResponse<T>`)

#### Component Props
- **Props Interface**: ComponentName + "Props" (e.g., `PizzaCardProps`, `CartItemProps`)
- **Props destructuring**: Use object destructuring in function signature
- **Children prop**: Use `React.ReactNode` type

#### CSS Class Naming
- **Utility classes**: Use Tailwind's standard naming (e.g., `bg-primary-600`, `text-gray-900`)
- **Custom classes**: kebab-case (e.g., `.btn-primary`, `.card`, `.input-field`)
- **Component-specific**: Prefix with component name if needed (e.g., `.pizza-card-image`)

#### ID and Key Naming
- **HTML IDs**: kebab-case (e.g., `id="order-number"`, `id="customer-name"`)
- **Object keys**: camelCase (e.g., `{ pizzaId, orderNumber, createdAt }`)
- **Data IDs**: kebab-case (e.g., `"margherita"`, `"bbq-chicken"`, `"red-onion"`)
- **React keys**: Use unique identifiers (e.g., `key={pizza.id}`, `key={item.id}`)

#### API Naming
- **Endpoints**: lowercase with hyphens (e.g., `/api/menu`, `/api/orders`, `/api/orders/[id]`)
- **HTTP Methods**: Use appropriate verbs (GET, POST, PUT, DELETE)
- **Response fields**: camelCase (e.g., `{ success, data, error }`)

#### Context & Provider Naming
- **Context**: ComponentName + "Context" (e.g., `CartContext`)
- **Provider**: ComponentName + "Provider" (e.g., `CartProvider`)
- **Hook**: "use" + ComponentName (e.g., `useCart()`)

#### State Variable Naming
- **Boolean states**: Use "is", "has", "should" prefixes (e.g., `isLoading`, `hasError`, `isAdding`)
- **Array states**: Plural nouns (e.g., `items`, `pizzas`, `orders`)
- **Object states**: Singular nouns (e.g., `formData`, `order`, `customerInfo`)
- **Setters**: "set" + StateName (e.g., `setIsLoading`, `setItems`, `setFormData`)

#### Examples
```typescript
// ✅ Good naming
const orderNumber = generateOrderNumber();
const [isLoading, setIsLoading] = useState(false);
function handleSubmit(e: React.FormEvent) { }
interface PizzaCardProps { pizza: Pizza; }
const STORAGE_KEY = 'pizza-cart';

// ❌ Bad naming
const OrderNum = generate_order_num();
const [loading, changeLoading] = useState(false);
function submit(e: React.FormEvent) { }
interface Props { pizza: Pizza; }
const storagekey = 'pizza-cart';
```

## Key Features & Implementation Details

### Shopping Cart (Context API)
- **Location**: `contexts/CartContext.tsx`
- **Pattern**: React Context + useReducer for state management
- **Actions**: ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, CLEAR_CART, LOAD_CART
- **Persistence**: Auto-saves to localStorage on every change
- **Auto-load**: Restores cart from localStorage on mount
- **Usage**: Import `useCart()` hook in any Client Component

### Price Calculations
- **Base Price**: Pizza base price × size multiplier
- **Toppings**: Only non-default toppings add to price
- **Tax**: 8% of subtotal
- **Delivery Fee**: Fixed $4.99 per order
- **Functions**: `calculateItemPrice()`, `calculateCartTotals()` in `lib/utils.ts`

### Data Models
```typescript
PizzaSize: 'small' | 'medium' | 'large' | 'xlarge'
Pizza: { id, name, description, category, imageUrl, basePrice, sizes[], defaultToppings[] }
Topping: { id, name, price, category }
CartItem: { id, pizzaId, pizzaName, size, basePrice, selectedToppings[], quantity, totalPrice }
Order: { id, orderNumber, customerInfo, items[], subtotal, tax, deliveryFee, total, status, createdAt }
```

### API Routes
- **Pattern**: Use Next.js Route Handlers in `app/api/`
- **Request**: `NextRequest` from 'next/server'
- **Response**: `NextResponse.json()` with `ApiResponse<T>` format
- **Error Handling**: Try-catch with appropriate HTTP status codes
- **File Operations**: Use Node.js `fs/promises` for order persistence

### Forms & Validation
- HTML5 validation with `required` attributes
- Controlled components with `useState`
- Form submission prevents default and calls API
- Loading states during submission
- Error messages displayed above forms

### Images
- Use Next.js `Image` component from 'next/image'
- External images configured in `next.config.js` with remotePatterns
- Current source: Unsplash CDN
- Always include `alt`, `fill`, and `sizes` props

## Docker Configuration

### Dockerfile
- **Multi-stage build**: deps → builder → runner
- **Base image**: node:20-alpine (lightweight)
- **Output mode**: standalone (configured in next.config.js)
- **User**: Non-root user (nextjs:nodejs)
- **Port**: 3000
- **Volume**: `/app/data/orders` for order persistence

### docker-compose.yml
- Service name: `pizza-app`
- Port mapping: `3000:3000`
- Volume: `order-data` for persistent storage
- Health check: Uses `/api/menu` endpoint
- Restart policy: `unless-stopped`

## Common Patterns & Best Practices

### Adding New Features
1. Define TypeScript types in `lib/types.ts`
2. Create reusable utilities in `lib/utils.ts`
3. Build UI components in `components/`
4. Create page routes in `app/`
5. Add API endpoints in `app/api/` if needed

### State Management
- Use React Context for global state (cart)
- Use `useState` for component-local state
- Use `useReducer` for complex state logic
- Avoid prop drilling - use Context when needed

### Data Fetching
- Server Components: Direct data access or imports
- Client Components: Fetch from API routes
- Use `async/await` syntax
- Handle loading and error states

### Error Handling
- API routes: Return `{ success: false, error: string }` format
- Components: Display user-friendly error messages
- Console.error for debugging in API routes
- Use try-catch blocks consistently

### Code Quality
- Use descriptive variable and function names
- Add comments for complex business logic
- Keep functions small and focused
- Use TypeScript's type system fully
- Follow existing file structure and naming conventions

## Environment & Configuration

### No Environment Variables Required
- App works out of the box with defaults
- Menu data is static (no database needed)
- Orders saved to local filesystem
- No external API keys or secrets required

### Development
- Start dev server: `npm run dev` (port 3000)
- Build for production: `npm run build`
- Run production build: `npm start`
- Lint code: `npm run lint`

### Docker Deployment
- Build: `docker-compose up --build`
- Run: `docker-compose up`
- Stop: `docker-compose down`
- Logs: `docker-compose logs -f`

## When Working on This Project

### DO:
- ✅ Use Server Components by default (better performance)
- ✅ Add `'use client'` only when necessary
- ✅ Use Tailwind utilities for all styling
- ✅ Type everything with TypeScript
- ✅ Follow existing file structure and patterns
- ✅ Test in browser after changes
- ✅ Handle errors gracefully
- ✅ Use the `useCart()` hook for cart operations
- ✅ Keep components focused and reusable

### DON'T:
- ❌ Install additional state management libraries (Redux, Zustand, etc.)
- ❌ Add CSS modules or styled-components (use Tailwind)
- ❌ Use Pages Router patterns (this is App Router)
- ❌ Hardcode values - use constants and utils
- ❌ Skip error handling in API routes
- ❌ Use inline styles (use Tailwind classes)
- ❌ Create giant components (split into smaller ones)
- ❌ Bypass the Context API for cart state

## Extending the Application

### Adding New Pizza Categories
1. Update `Pizza['category']` type in `lib/types.ts`
2. Add new pizzas to `lib/data/menu.json`
3. Update filter logic if needed in menu page

### Adding New API Endpoints
1. Create new route handler in `app/api/`
2. Define request/response types
3. Use `NextRequest` and `NextResponse`
4. Follow error handling pattern

### Adding New Pages
1. Create folder in `app/` directory
2. Add `page.tsx` file (Server Component by default)
3. Add `'use client'` if interactivity needed
4. Update navigation in `Header.tsx` if needed

### Database Migration (Future)
To replace JSON file storage with a database:
1. Update API routes in `app/api/orders/`
2. Replace `fs` operations with database client
3. Keep the same API response format
4. No changes needed to frontend components

## Testing Checklist
When making changes, verify:
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] App runs in development (`npm run dev`)
- [ ] No console errors in browser
- [ ] Cart persists across page refreshes
- [ ] Order submission creates JSON file
- [ ] Order confirmation page displays correctly
- [ ] Mobile responsive design works
- [ ] Docker build completes successfully
- [ ] All interactive elements function properly

## Quick Reference

### Import Paths
```typescript
// Types
import { Pizza, CartItem, Order } from '@/lib/types';

// Utils
import { formatPrice, calculateItemPrice } from '@/lib/utils';

// Context
import { useCart } from '@/contexts/CartContext';

// Components
import Header from '@/components/Header';
```

### Common Tailwind Classes
```css
/* Buttons */
.btn-primary, .btn-secondary

/* Containers */
.card, .container mx-auto px-4

/* Layout */
.flex, .grid grid-cols-3 gap-8

/* Responsive */
md:col-span-2, lg:grid-cols-3

/* Animations */
.animate-fade-in, .animate-slide-up
```

### API Response Format
```typescript
{
  success: boolean;
  data?: T;           // On success
  error?: string;     // On failure
}
```

---

**Remember**: This is a complete, working application. When adding features or making changes, maintain consistency with existing patterns and architecture.


For any new feature, be sure to include test cases.  Both positive and negative scenarios should be covered.
