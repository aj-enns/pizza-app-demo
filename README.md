# Pizza Ordering Website

A modern, responsive pizza ordering website built with Next.js 15, TypeScript, Tailwind CSS, and Docker, featuring comprehensive SRE instrumentation for performance monitoring.

## Features

- 🍕 **Browse Menu** - View delicious pizzas with different categories
- 🛒 **Shopping Cart** - Add/remove items, adjust quantities with React Context API
- 📦 **Order Management** - Complete checkout with delivery information
- 💾 **JSON Storage** - Orders saved to JSON files for persistence
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- 🐳 **Dockerized** - Ready for containerized deployment
- 📊 **SRE Instrumentation** - Built-in performance monitoring and tracking
- ⚡ **Performance Monitoring** - Real-time tracking of slow operations and bottlenecks

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Icons**: Lucide React
- **Deployment**: Docker & Docker Compose

## Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Docker Commands

**Build the Docker image:**
```bash
docker build -t pizza-ordering-app .
```

**Run the container:**
```bash
docker run -p 3000:3000 -v pizza-data:/app/data/orders pizza-ordering-app
```

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── menu/           # Menu API endpoint
│   │   └── orders/         # Orders API endpoints
│   ├── cart/               # Shopping cart page
│   ├── checkout/           # Checkout page
│   ├── menu/               # Menu browsing page
│   ├── order-confirmation/ # Order confirmation page
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── components/              # Reusable React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── PizzaCard.tsx
│   ├── CartItem.tsx
│   └── CartSummary.tsx
├── contexts/               # React Context providers
│   └── CartContext.tsx    # Shopping cart state management
├── lib/                   # Utilities and data
│   ├── types.ts          # TypeScript type definitions
│   ├── utils.ts          # Helper functions
│   └── data/
│       └── menu.json     # Pizza menu data
├── data/                  # Runtime data storage
│   └── orders/           # JSON order files
├── public/               # Static assets
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose configuration
└── package.json        # Dependencies and scripts
```

## Features Breakdown

### 1. Menu Browsing
- Display pizzas with images, descriptions, and prices
- Multiple size options for each pizza
- Category filtering (Classic, Specialty, Vegetarian, Premium)

### 2. Shopping Cart
- Add pizzas with selected size
- Adjust quantities
- Remove items
- Real-time price calculation with tax and delivery fee
- Persistent storage using localStorage

### 3. Checkout Process
- Customer information form
- Order summary
- Form validation
- Order submission to API

### 4. Order Management
- Orders saved as JSON files in `data/orders/`
- Unique order numbers generated
- Order confirmation page with details
- Order retrieval by ID

## API Endpoints

### GET `/api/menu`
Returns the complete menu with pizzas and toppings.

### POST `/api/orders`
Creates a new order. Requires customer info and cart items.

### GET `/api/orders/[id]`
Retrieves a specific order by ID.

## Environment Variables

No environment variables are required for basic functionality. The app works out of the box with JSON file storage.

## Docker Configuration

The Dockerfile uses a multi-stage build process:

1. **Dependencies Stage**: Installs production dependencies
2. **Build Stage**: Builds the Next.js application
3. **Production Stage**: Creates minimal runtime image with only necessary files

### Volume Mounting

Orders are persisted using Docker volumes:
```yaml
volumes:
  - order-data:/app/data/orders
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:report` - Run tests and open HTML report

### Adding New Pizzas

Edit `lib/data/menu.json` to add new pizzas or modify existing ones.

## SRE Instrumentation & Performance Monitoring

### Overview

The application includes comprehensive Site Reliability Engineering (SRE) instrumentation to help identify performance bottlenecks and long-running operations. This is essential for maintaining application reliability and user experience.

### Features

#### Real-Time Performance Tracking
- **Automatic tracking** of all API routes, database operations, calculations, and file I/O
- **Customizable thresholds** for different operation types
- **Slow operation detection** with automatic warnings
- **Context-aware logging** with operation metadata

#### Performance Thresholds

The system uses industry-standard thresholds (configurable in `lib/performance.ts`):

| Operation Type | Threshold | Purpose |
|----------------|-----------|---------|
| API Request | 1000ms | HTTP endpoint response time |
| Database Query | 500ms | Data retrieval operations |
| Calculation | 100ms | Business logic and computations |
| Render | 50ms | UI component rendering |
| File Operation | 200ms | File read/write operations |

#### Visual Performance Monitor

A floating performance monitor UI provides real-time visibility:

- **Summary Statistics**: Total operations, slow operation count, average duration
- **Recent Operations**: Last 10 operations with execution times
- **Slow Operations Tab**: Filter view of problematic operations
- **Color-coded indicators**: Green for fast, red for slow operations
- **Progress bars**: Visual representation of performance vs. threshold
- **Export functionality**: Download metrics as JSON for analysis

### Using the Performance Monitor

#### Accessing the Monitor

1. Run the application in development or production mode
2. Click the floating **Activity** button in the bottom-right corner
3. The performance dashboard will open showing real-time metrics

#### Reading Metrics

**Summary Stats:**
- **Total Operations**: Number of tracked operations since last clear
- **Slow Operations**: Count of operations exceeding thresholds (⚠️ indicator)
- **Avg Duration**: Average execution time across all operations
- **Slowest**: Longest operation duration recorded

**Metric Cards:**
- **Operation Name**: Function or API endpoint name
- **Duration**: Execution time in milliseconds
- **Timestamp**: When the operation occurred
- **Percentage Over**: How much slower than threshold (for slow ops)
- **Context**: Additional metadata (endpoint, item count, etc.)

#### Actions

- **Clear Metrics**: Reset all tracked metrics (useful for focused testing)
- **Export Data**: Download metrics as JSON for external analysis or reporting

### Instrumented Components

#### API Routes (All instrumented)

**`/api/menu` (GET)**
```typescript
// Tracks complete request/response cycle
// Threshold: 1000ms (API_REQUEST)
// Context: endpoint
```

**`/api/orders` (POST)**
```typescript
// Tracks:
// - Overall request handling (1000ms threshold)
// - Customer info validation (100ms threshold)
// - Cart item validation & recalculation (100ms threshold)
// - File write operation (200ms threshold)
// Context: endpoint, method, itemCount, orderId
```

**`/api/orders` (GET)**
```typescript
// Tracks order listing
// Threshold: 1000ms (API_REQUEST)
```

**`/api/orders/[id]` (GET)**
```typescript
// Tracks:
// - Overall request (1000ms threshold)
// - File read operation (200ms threshold)
// Context: endpoint, orderId
```

#### Utility Functions

**`getPizzas()`**
```typescript
// Tracks menu data retrieval
// Threshold: 500ms (DATABASE_QUERY)
// Context: operation, pizzaCount
```

**`calculateItemPrice()`**
```typescript
// Tracks price calculation logic
// Threshold: 100ms (CALCULATION)
// Context: size, toppingCount, basePrice
```

**`calculateCartTotals()`**
```typescript
// Tracks cart totals computation
// Threshold: 100ms (CALCULATION)
// Context: itemCount, hasItems
```

### For SRE Teams

#### Identifying Performance Issues

1. **Open Performance Monitor** during load testing or production monitoring
2. **Watch for red-highlighted operations** - these exceed thresholds
3. **Check "Slow Operations" count** - increasing numbers indicate degradation
4. **Export metrics** for trend analysis and alerting

#### Common Bottlenecks to Monitor

- **File I/O Operations**: `writeOrderFile`, `readOrderFile`
  - *Issue*: Slow disk I/O or file system contention
  - *Solution*: Consider database migration or faster storage

- **Cart Validation**: `validateAndRecalculateItems`
  - *Issue*: Large cart sizes or complex validation logic
  - *Solution*: Optimize validation logic or implement pagination

- **Menu Retrieval**: `getPizzas`
  - *Issue*: Large menu data or inefficient JSON parsing
  - *Solution*: Implement caching or database indexing

#### Setting Up Alerts

Export metrics periodically and set up alerts based on:

```javascript
// Example: Alert if average API response time > 800ms
if (summary.averageDuration > 800) {
  alert('Performance degradation detected');
}

// Example: Alert if > 10% operations are slow
if (summary.slowOperations / summary.totalOperations > 0.1) {
  alert('High slow operation rate');
}
```

#### Performance Testing

Use the instrumentation during load testing:

```bash
# Run load test
npm run dev

# In browser, open Performance Monitor
# Observe metrics under load

# Export metrics after test
# Click "Export Data" button
# Analyze JSON file for trends
```

### Development Usage

#### Adding Instrumentation to New Code

**For async operations:**
```typescript
import { trackPerformance, PERFORMANCE_THRESHOLDS } from '@/lib/performance';

export async function myAsyncFunction() {
  return trackPerformance(
    'myAsyncFunction',  // Operation name
    async () => {
      // Your async code here
      const result = await someAsyncWork();
      return result;
    },
    PERFORMANCE_THRESHOLDS.API_REQUEST,  // Choose appropriate threshold
    { customContext: 'value' }  // Optional context
  );
}
```

**For synchronous operations:**
```typescript
import { trackPerformanceSync, PERFORMANCE_THRESHOLDS } from '@/lib/performance';

export function myFunction(data: any[]) {
  return trackPerformanceSync(
    'myFunction',
    () => {
      // Your sync code here
      return data.map(item => process(item));
    },
    PERFORMANCE_THRESHOLDS.CALCULATION,
    { itemCount: data.length }  // Context helps debugging
  );
}
```

#### Custom Thresholds

Define custom thresholds for specific operations:

```typescript
const CUSTOM_THRESHOLD = 2000; // 2 seconds

await trackPerformance(
  'slowExternalAPI',
  async () => fetch('https://slow-api.com'),
  CUSTOM_THRESHOLD
);
```

#### Programmatic Access

Access metrics in code for custom analysis:

```typescript
import { performanceLogger } from '@/lib/performance';

// Get all metrics
const metrics = performanceLogger.getMetrics();

// Get slow operations
const slowOps = performanceLogger.getSlowOperations();

// Get metrics for specific operation
const apiMetrics = performanceLogger.getMetricsByOperation('API:GET:/api/menu');

// Get average duration
const avg = performanceLogger.getAverageDuration('calculateCartTotals');

// Get summary
const summary = performanceLogger.getSummary();

// Clear metrics
performanceLogger.clear();
```

### Testing Performance Monitoring

Run the comprehensive test suite:

```bash
# Run all tests including performance tests
npm test

# Run only performance tests
npm test performance

# Run with coverage
npm run test:coverage
```

**Performance test coverage includes:**
- ✅ Sync and async operation tracking
- ✅ Slow operation detection
- ✅ Error handling in tracked operations
- ✅ Context propagation
- ✅ Metrics aggregation and summaries
- ✅ Multiple concurrent operations
- ✅ Nested operation tracking
- ✅ UI component interactions

### Production Considerations

#### Environment-Specific Logging

The system logs differently based on environment:

- **Development**: All operations logged to console
- **Production**: Only slow operations logged (warnings)

#### Performance Impact

The instrumentation is designed to be lightweight:
- Minimal overhead (~0.1-0.5ms per tracked operation)
- Uses high-precision `performance.now()` API
- Automatic metric pruning (keeps last 1000 operations)
- No network calls or external dependencies

#### Disabling in Production (Optional)

To disable performance monitoring in production:

```typescript
// lib/performance.ts
const ENABLE_TRACKING = process.env.NODE_ENV !== 'production';

// Wrap tracking calls
if (ENABLE_TRACKING) {
  trackPerformance(/* ... */);
}
```

Or create a no-op wrapper for production builds.

### Architecture

```
lib/performance.ts          # Core performance tracking utilities
├── PerformanceLogger       # Singleton logger class
├── trackPerformance()      # Async operation tracker
├── trackPerformanceSync()  # Sync operation tracker
└── PERFORMANCE_THRESHOLDS  # Predefined thresholds

components/PerformanceMonitor.tsx  # Visual dashboard UI
├── Floating button
├── Summary statistics
├── Metrics list
├── Export functionality
└── Real-time updates

app/layout.tsx             # Global integration
└── <PerformanceMonitor />  # Rendered on all pages
```

### Metrics Data Structure

```typescript
interface PerformanceMetric {
  operationName: string;      // Function or endpoint name
  duration: number;           // Execution time (ms)
  timestamp: string;          // ISO timestamp
  threshold: number;          // Threshold for this operation
  isSlowOperation: boolean;   // Exceeded threshold?
  context?: {                 // Optional context
    [key: string]: any;
  };
}
```

### Troubleshooting

**Monitor not appearing:**
- Check that `<PerformanceMonitor />` is in `app/layout.tsx`
- Ensure client-side JavaScript is enabled
- Check browser console for errors

**No metrics showing:**
- Perform some operations (navigate pages, add to cart, checkout)
- Verify API calls are completing successfully
- Check that instrumentation is properly imported

**Metrics not updating:**
- Confirm monitor is open (metrics only update when visible)
- Check `refreshInterval` prop (default 2000ms)
- Verify no console errors

**Export not working:**
- Check browser download permissions
- Verify pop-up blocker settings
- Ensure metrics exist before exporting

## Testing

### Running Tests

The project includes a comprehensive test suite covering:
- ✅ Unit tests for utility functions
- ✅ Component tests with React Testing Library
- ✅ Context/state management tests
- ✅ API route tests
- ✅ Page integration tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode (during development):**
```bash
npm run test:watch
```

**Generate coverage report:**
```bash
npm run test:coverage
```

**View HTML test report:**
```bash
npm run test:report
```

This will run the tests and automatically open the HTML report in your browser. The report is located at `test-report/index.html` and includes:
- Test results organized by file
- Pass/fail status for each test
- Console logs and error messages
- Execution time statistics

### Test Coverage

The test suite covers:

- **Utilities** (`lib/utils.ts`) - 100% coverage
  - Price calculations and formatting
  - Cart totals calculation
  - Order number generation
  - Menu data retrieval

- **Components** (`components/`) - Full coverage
  - Header with cart badge
  - Footer with navigation
  - PizzaCard with size selection
  - CartItem with quantity controls
  - CartSummary with totals

- **Context** (`contexts/CartContext.tsx`) - Complete coverage
  - Add/remove items
  - Update quantities
  - Clear cart
  - LocalStorage persistence

- **API Routes** (`app/api/`) - Comprehensive tests
  - Menu endpoint
  - Order creation with validation
  - Input sanitization
  - Error handling

- **Pages** (`app/`) - Integration tests
  - Menu page rendering
  - Cart page (empty and with items)
  - Checkout page with form

### Test Best Practices

The test suite follows these best practices:

1. **Isolation** - Each test is independent and doesn't affect others
2. **Mocking** - External dependencies are properly mocked
3. **Coverage** - Both positive and negative scenarios are tested
4. **Readability** - Tests are well-organized with descriptive names
5. **Real Behavior** - Tests verify actual user interactions
6. **Security** - API tests validate input sanitization and validation

### Continuous Integration

To add tests to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage
```

## Production Deployment

The application is optimized for production with:
- Next.js standalone output mode
- Multi-stage Docker build
- Health checks in Docker Compose
- Non-root user for security
- Persistent volume for order data

## License

MIT

## Author

Built with ❤️ using Next.js and Docker
