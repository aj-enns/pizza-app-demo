# Performance Monitor UI Guide

## Visual Overview

The Performance Monitor provides a real-time, interactive dashboard for monitoring application performance directly in your browser.

## UI Components

### 1. Floating Action Button (Closed State)
```
┌─────────────────────────────┐
│                             │
│   [Your App Content]        │
│                             │
│                             │
│                      ┌───┐  │
│                      │ ⚡ │◄─── Click to open
│                      └───┘  │
└─────────────────────────────┘
```

### 2. Expanded Dashboard (Open State)

```
┌───────────────────────────────────────────┐
│  ⚡ Performance Monitor              ✕    │◄─── Header
├───────────────────────────────────────────┤
│                                           │
│  ┌────────────┐  ┌─────────────────┐    │
│  │   Total    │  │ ⚠️  Slow Ops    │    │◄─── Summary Stats
│  │    42      │  │      5          │    │
│  └────────────┘  └─────────────────┘    │
│                                           │
│  ┌────────────┐  ┌─────────────────┐    │
│  │ 📈 Avg     │  │ ⏱️  Slowest     │    │
│  │  123.45ms  │  │   1500ms        │    │
│  └────────────┘  └─────────────────┘    │
│                                           │
├───────────────────────────────────────────┤
│ [Recent]  [Slow (5)]                     │◄─── Tabs
├───────────────────────────────────────────┤
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ API:GET:/api/menu         125.5ms ✓│  │◄─── Fast operation (green)
│ │ ████████░░░░░░░░                    │  │
│ │ endpoint: /api/menu                 │  │
│ └─────────────────────────────────────┘  │
│                                           │
│ ┌─────────────────────────────────────┐  │
│ │ writeOrderFile         1500ms ⚠️ +50%│  │◄─── Slow operation (red)
│ │ ███████████████████████████████████ │  │
│ │ orderId: order-abc123               │  │
│ └─────────────────────────────────────┘  │
│                                           │
│ [More metrics...]                         │
│                                           │
├───────────────────────────────────────────┤
│ [Clear Metrics]  [Export Data]           │◄─── Actions
└───────────────────────────────────────────┘
```

## Color Coding

### Summary Panel
- **Green numbers** (slow operations = 0): All operations performing well
- **Red numbers** (slow operations > 0): Performance issues detected
- **Gray numbers**: Neutral metrics (totals, averages)

### Metric Cards
- **White background + green duration**: Operation under threshold ✓
- **Red background + red duration**: Operation over threshold ⚠️
- **Green progress bar**: Good performance
- **Red progress bar**: Poor performance

## Component Details

### Header
```
⚡ Performance Monitor                    ✕
```
- **⚡ Icon**: Activity indicator
- **Title**: "Performance Monitor"
- **✕ Button**: Close dashboard

### Summary Cards (2x2 Grid)

#### Total Operations
```
┌─────────────┐
│   Total     │
│    42       │
└─────────────┘
```
Shows count of all tracked operations since last clear.

#### Slow Operations
```
┌──────────────┐
│ ⚠️ Slow Ops  │
│     5        │◄─── Red if > 0, Green if 0
└──────────────┘
```
Count of operations exceeding their thresholds.

#### Average Duration
```
┌──────────────┐
│ 📈 Avg       │
│  123.45ms    │
└──────────────┘
```
Mean execution time across all operations.

#### Slowest Operation
```
┌──────────────┐
│ ⏱️ Slowest   │
│   1500ms     │
└──────────────┘
```
Maximum duration recorded.

### Tabs
```
[Recent]  [Slow (5)]
   ▲         └─────── Shows count
   └─── Currently active
```

### Metric Cards

#### Fast Operation Example
```
┌─────────────────────────────────────────────────┐
│ calculateCartTotals              15.2ms         │◄─── Green
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (15%)      │◄─── Progress bar
│ 2:30:45 PM                                      │◄─── Timestamp
│ itemCount: 3, hasItems: true                    │◄─── Context
└─────────────────────────────────────────────────┘
```

#### Slow Operation Example
```
┌─────────────────────────────────────────────────┐
│ API:POST:/api/orders                    1500ms  │◄─── Red
│ ███████████████████████████████████████ (150%) │◄─── Full bar
│ 2:30:47 PM                        +50%          │◄─── % over threshold
│ endpoint: /api/orders, method: POST             │◄─── Context
│ itemCount: 45                                   │
└─────────────────────────────────────────────────┘
```

### Action Buttons
```
┌─────────────────────────────────────────────┐
│ [Clear Metrics]      [Export Data]          │
│      Gray               Blue                │
└─────────────────────────────────────────────┘
```

- **Clear Metrics**: Reset all tracked data (gray button)
- **Export Data**: Download JSON file (blue button)

## Interactions

### Opening/Closing
1. **Open**: Click floating ⚡ button
2. **Close**: Click ✕ in header or click outside (stays visible)

### Viewing Metrics
- **Scroll**: Metrics list scrolls independently
- **Hover**: No special hover states (all info visible)
- **Timestamps**: Show when operation occurred

### Clearing Data
```
Click [Clear Metrics]
   ↓
Confirmation (immediate)
   ↓
All metrics cleared
Summary resets to zeros
Recent list shows "No operations tracked yet"
```

### Exporting Data
```
Click [Export Data]
   ↓
Browser downloads file:
  performance-metrics-1700000000000.json
   ↓
File contains all metrics in JSON format
```

## Real-World Usage Examples

### Example 1: Normal Operation
```
Summary:
  Total: 50
  Slow: 0 ← Green!
  Avg: 85ms
  Slowest: 245ms

Recent Metrics:
  All cards have white background
  All progress bars are green
  All durations under threshold
```
**Interpretation**: System performing well ✓

### Example 2: Performance Issue
```
Summary:
  Total: 50
  Slow: 12 ← Red! 24% slow rate
  Avg: 456ms
  Slowest: 2300ms

Recent Metrics:
  Multiple red cards visible
  Long progress bars (over 100%)
  "+150%", "+80%" over threshold
```
**Interpretation**: Performance degradation detected ⚠️

### Example 3: Intermittent Issue
```
Summary:
  Total: 100
  Slow: 3 ← 3% slow rate
  Avg: 120ms
  Slowest: 1800ms

Recent Metrics:
  Mostly green cards
  1-2 red cards visible
  Pattern: Same operation slow multiple times
```
**Interpretation**: Specific bottleneck identified ⚡

## Mobile/Responsive Behavior

### Desktop (>768px)
- Full dashboard: 384px wide (w-96)
- All features visible
- Smooth scrolling

### Tablet/Mobile (<768px)
- Dashboard scales to fit screen
- Grid layout adjusts
- Still fully functional
- May need vertical scrolling

## Browser Compatibility

✅ Chrome/Edge (recommended)
✅ Firefox
✅ Safari
✅ Opera

Requires:
- ES6 support
- localStorage API
- performance.now() API

## Performance of the Monitor Itself

The Performance Monitor is optimized:
- **Renders only when open**
- **Updates every 2 seconds** (configurable)
- **No impact when closed**
- **Efficient React rendering**

Overhead:
- Closed: 0ms
- Open: ~1-2ms per update
- Negligible impact on application performance

## Tips for SRE Teams

### Quick Checks
1. **Glance at summary**: If "Slow Ops" is red, investigate
2. **Scan recent list**: Look for red cards
3. **Check percentages**: >50% over threshold = priority issue

### During Incidents
1. **Open monitor immediately**
2. **Look for patterns** in slow operations
3. **Check context** for commonalities
4. **Export data** for post-mortem

### Load Testing
1. **Clear metrics** before test
2. **Keep monitor open** during test
3. **Watch for** increasing slow op count
4. **Export results** after test

### Daily Monitoring
1. **Check periodically** during business hours
2. **Note any red indicators**
3. **Export weekly** for trend analysis
4. **Compare to baselines**

## Customization Options

The monitor can be customized via props:

```typescript
<PerformanceMonitor 
  refreshInterval={1000}  // Update every 1 second
/>
```

Default: 2000ms (2 seconds)

## Keyboard Shortcuts

None currently implemented, but could add:
- `Esc`: Close monitor
- `Ctrl+E`: Export data
- `Ctrl+C`: Clear metrics

## Accessibility

The monitor includes:
- ✅ Semantic HTML
- ✅ ARIA labels (title attributes)
- ✅ Keyboard accessible buttons
- ✅ Color + text indicators (not color-only)
- ✅ Clear focus states

## Future Enhancements

Potential improvements:
- [ ] Filtering by operation name
- [ ] Time range selection
- [ ] Graph/chart view
- [ ] Comparison mode
- [ ] Alert configuration UI
- [ ] Real-time notifications

---

**The Performance Monitor provides instant visibility into application performance, making it easy for SRE teams to identify and diagnose issues in real-time.**
