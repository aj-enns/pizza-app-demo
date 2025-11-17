# SRE Instrumentation Guide

## Overview

This document provides a comprehensive guide for Site Reliability Engineers (SREs) to use the built-in performance monitoring and instrumentation features of the Pizza Ordering Application.

## Quick Start for SREs

### 1. Access Performance Monitor

```bash
# Start the application
npm run dev  # or npm start for production build

# Open browser to http://localhost:3000
# Click the floating Activity icon (bottom-right corner)
```

### 2. Understand the Dashboard

**Summary Panel (Top)**
- **Total Operations**: Count of all tracked operations
- **Slow Operations**: Operations exceeding thresholds (⚠️ = alert)
- **Avg Duration**: Mean execution time
- **Slowest**: Maximum duration recorded

**Metrics List (Middle)**
- Recent operations in reverse chronological order
- Color coding: Green = fast, Red = slow
- Progress bars show performance relative to threshold
- Click to see detailed context

**Actions (Bottom)**
- **Clear Metrics**: Reset tracking (useful for focused testing)
- **Export Data**: Download JSON for external analysis

## Performance Thresholds

| Category | Threshold | Use Case | Alert Level |
|----------|-----------|----------|-------------|
| API Request | 1000ms | HTTP endpoints | P2 - Investigate |
| Database Query | 500ms | Data operations | P2 - Investigate |
| Calculation | 100ms | Business logic | P3 - Monitor |
| Render | 50ms | UI components | P3 - Monitor |
| File Operation | 200ms | File I/O | P2 - Investigate |

### Alerting Rules

**Critical (P1):**
- Any operation > 5x threshold
- File operations > 1000ms
- API requests > 5000ms

**High (P2):**
- Operations consistently > 2x threshold
- >20% of operations are slow
- Average duration trending upward

**Medium (P3):**
- Individual slow operations
- Average duration > threshold
- Intermittent performance issues

## Instrumented Components

### API Endpoints

#### 1. Menu API (`GET /api/menu`)

**What it tracks:**
- Complete request/response cycle
- Menu data retrieval (`getPizzas()`)
- Topping data retrieval

**Expected performance:**
- Normal: 50-200ms
- Warning: 200-500ms
- Critical: >1000ms

**Common issues:**
- Large menu JSON parsing
- Cold start delays (first request)

**Mitigation:**
- Implement response caching
- Use CDN for static menu data
- Pre-warm on deployment

#### 2. Order Creation (`POST /api/orders`)

**What it tracks:**
- Overall request handling
- Customer info validation (100ms threshold)
- Cart item validation & recalculation (100ms threshold)
- File write operation (200ms threshold)

**Expected performance:**
- Normal: 100-500ms
- Warning: 500-800ms
- Critical: >1000ms

**Common issues:**
- Large cart sizes (>20 items)
- Slow disk I/O
- Complex validation logic

**Mitigation:**
- Implement cart size limits (already: 50 items max)
- Use database instead of file storage
- Optimize validation algorithms
- Add write queue for high load

#### 3. Order Retrieval (`GET /api/orders/[id]`)

**What it tracks:**
- Overall request
- File read operation (200ms threshold)

**Expected performance:**
- Normal: 20-100ms
- Warning: 100-200ms
- Critical: >1000ms

**Common issues:**
- Disk I/O contention
- Missing file (404s are fast but errors)
- Large order JSON parsing

**Mitigation:**
- Implement read-through cache
- Use database for production
- Add file system monitoring

### Utility Functions

#### `calculateItemPrice()`

**What it tracks:** Price calculation with toppings

**Expected:** <10ms  
**Warning:** 50-100ms  
**Critical:** >100ms

**Issues:**
- Large topping arrays
- Inefficient filtering/mapping

#### `calculateCartTotals()`

**What it tracks:** Cart subtotal, tax, fees

**Expected:** <20ms  
**Warning:** 50-100ms  
**Critical:** >100ms

**Issues:**
- Large cart size
- Repeated calculations

## Monitoring Strategies

### Real-Time Monitoring

```bash
# Keep Performance Monitor open during:
1. Load testing
2. Deployment verification
3. Production incident investigation
4. Performance optimization work
```

### Periodic Analysis

**Daily:**
```bash
# Export metrics at end of day
# Analyze trends:
- Peak hour performance
- Slow operation patterns
- Error-related slowdowns
```

**Weekly:**
```bash
# Compare week-over-week:
- Average duration trends
- Slow operation frequency
- New bottlenecks introduced
```

### Load Testing Integration

```bash
# 1. Clear metrics
# 2. Run load test (e.g., Apache Bench, k6, artillery)
# 3. Export metrics
# 4. Analyze:
#    - 95th percentile latency
#    - Slow operation rate under load
#    - Performance degradation patterns
```

Example with Apache Bench:
```bash
# Clear metrics in UI
ab -n 1000 -c 10 http://localhost:3000/api/menu

# Check Performance Monitor
# Export data
# Look for:
# - Increased average duration
# - More slow operations
# - Threshold breaches
```

## Incident Response

### Performance Degradation

**Symptoms:**
- Increasing slow operation count
- Rising average duration
- User complaints about slowness

**Response:**
1. Open Performance Monitor
2. Identify slow operations (red cards)
3. Check context for patterns:
   - Specific endpoints?
   - Large data sizes?
   - Specific times?
4. Export metrics for analysis
5. Implement targeted fix
6. Verify with monitoring

### Example: Slow Order Creation

```
Observation: POST /api/orders taking 2000ms (2x threshold)

Investigation:
1. Check metric context:
   - itemCount: 45 items (large cart)
   - validateAndRecalculateItems: 1800ms (bottleneck)

2. Root cause: O(n²) validation loop with large cart

3. Solution: Optimize validation algorithm

4. Verification: Retest with 45-item cart, observe <500ms
```

## Alerting Setup

### Log-Based Alerts

Parse console warnings for alerting:

```javascript
// Pattern in logs:
[PERFORMANCE WARNING] API:POST:/api/orders took 1500ms (50% over 1000ms threshold)

// Alert on:
- Frequency: >10 warnings in 5 minutes
- Threshold breaches: >100% over threshold
- Specific operations: File operations >1000ms
```

### Metrics Export Analysis

```javascript
// metrics.json structure
{
  "operationName": "API:POST:/api/orders",
  "duration": 1500,
  "isSlowOperation": true,
  "context": { "itemCount": 45 }
}

// Analysis script (pseudocode):
const metrics = JSON.parse(exportedMetrics);
const slowOps = metrics.filter(m => m.isSlowOperation);
const slowRate = slowOps.length / metrics.length;

if (slowRate > 0.2) {
  sendAlert('High slow operation rate: ' + (slowRate * 100) + '%');
}
```

### Integration with Monitoring Tools

**Prometheus/Grafana:**
```typescript
// Add metrics export endpoint
// app/api/metrics/route.ts
export async function GET() {
  const summary = performanceLogger.getSummary();
  return new Response(
    `# HELP operations_total Total operations tracked
# TYPE operations_total counter
operations_total ${summary.totalOperations}

# HELP operations_slow Slow operations count
# TYPE operations_slow counter
operations_slow ${summary.slowOperations}

# HELP duration_avg Average operation duration
# TYPE duration_avg gauge
duration_avg ${summary.averageDuration}
    `,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
```

**Datadog/New Relic:**
```typescript
// Add custom metrics integration
import { performanceLogger } from '@/lib/performance';

setInterval(() => {
  const summary = performanceLogger.getSummary();
  
  // Send to Datadog
  dogstatsd.gauge('app.performance.ops_total', summary.totalOperations);
  dogstatsd.gauge('app.performance.ops_slow', summary.slowOperations);
  dogstatsd.gauge('app.performance.duration_avg', summary.averageDuration);
}, 60000); // Every minute
```

## Performance Optimization Workflow

### 1. Identify Bottleneck

```bash
# Open Performance Monitor
# Look for operations with:
# - Red highlighting (slow)
# - High percentage over threshold
# - Frequent occurrences
```

### 2. Reproduce Locally

```bash
# Clear metrics
# Execute specific operation
# Observe detailed metrics
# Check context for clues
```

### 3. Profile and Fix

```typescript
// Add detailed tracking within bottleneck
await trackPerformance(
  'detailed-validation-step-1',
  async () => { /* ... */ },
  100,
  { step: 1 }
);

// Identify sub-operation causing delay
// Optimize or refactor
```

### 4. Verify Improvement

```bash
# Clear metrics
# Re-run operation
# Compare new duration to baseline
# Ensure under threshold
```

### 5. Monitor in Production

```bash
# Deploy fix
# Monitor Performance Monitor for 24-48 hours
# Verify sustained improvement
# Export before/after metrics for documentation
```

## Best Practices

### DO ✅

- **Keep monitor open** during active troubleshooting
- **Export metrics** before and after changes
- **Track trends** over time, not just point-in-time
- **Investigate patterns**, not individual slow operations
- **Add context** to custom instrumentation
- **Clear metrics** before focused testing
- **Document findings** with exported metric data

### DON'T ❌

- **Ignore consistent slow operations** - they indicate real issues
- **Optimize blindly** - use metrics to guide decisions
- **Over-optimize** - sub-threshold operations may not need fixes
- **Forget to test** - verify optimizations actually help
- **Remove instrumentation** - it's low overhead and valuable
- **Ignore context** - it provides crucial debugging info

## Advanced Usage

### Custom Dashboards

Build custom analysis tools using exported data:

```javascript
// analyze-performance.js
const fs = require('fs');
const metrics = JSON.parse(fs.readFileSync('metrics.json'));

// Calculate p50, p95, p99
const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
const p50 = durations[Math.floor(durations.length * 0.50)];
const p95 = durations[Math.floor(durations.length * 0.95)];
const p99 = durations[Math.floor(durations.length * 0.99)];

console.log(`P50: ${p50}ms, P95: ${p95}ms, P99: ${p99}ms`);

// Find most common slow operations
const slowOps = metrics.filter(m => m.isSlowOperation);
const opCounts = {};
slowOps.forEach(m => {
  opCounts[m.operationName] = (opCounts[m.operationName] || 0) + 1;
});

console.log('Most frequent slow operations:', opCounts);
```

### A/B Testing Performance

```typescript
// Test two implementations
performanceLogger.clear();

// Implementation A
for (let i = 0; i < 100; i++) {
  await implementationA();
}
const avgA = performanceLogger.getAverageDuration('implementationA');

performanceLogger.clear();

// Implementation B
for (let i = 0; i < 100; i++) {
  await implementationB();
}
const avgB = performanceLogger.getAverageDuration('implementationB');

console.log(`A: ${avgA}ms vs B: ${avgB}ms - Winner: ${avgA < avgB ? 'A' : 'B'}`);
```

## Troubleshooting the Monitor

### Monitor Not Showing Metrics

**Check:**
1. Operations are actually running (try adding to cart)
2. Monitor is open (metrics only update when visible)
3. No browser console errors
4. Instrumentation imports are correct

### Metrics Seem Inaccurate

**Possible causes:**
1. Cold start effects (first operation always slower)
2. Browser throttling (dev tools open, background tab)
3. System load (other processes)
4. Network latency (for API calls)

**Solutions:**
- Run multiple iterations
- Clear metrics and re-test
- Test on production-like environment
- Use median instead of average

## Glossary

- **Operation**: Any tracked function or API call
- **Threshold**: Maximum acceptable duration for an operation type
- **Slow Operation**: Operation exceeding its threshold
- **Context**: Metadata attached to metrics for debugging
- **Duration**: Execution time in milliseconds
- **Metric**: Single recorded performance measurement

## Support

For issues with the performance monitoring system:

1. Check this guide and main README
2. Review test files for usage examples
3. Check console for instrumentation errors
4. Verify latest code version

## Changelog

**Version 1.0**
- Initial implementation
- API route instrumentation
- Utility function tracking
- Visual dashboard
- Export functionality
- Comprehensive test coverage
