/**
 * Performance monitoring utilities for SRE instrumentation
 * Tracks method execution times and identifies potential bottlenecks
 */

export interface PerformanceMetric {
  operationName: string;
  duration: number;
  timestamp: string;
  threshold: number;
  isSlowOperation: boolean;
  context?: Record<string, any>;
}

export interface PerformanceLog {
  level: 'info' | 'warn' | 'error';
  message: string;
  metric: PerformanceMetric;
}

// Default thresholds in milliseconds
export const PERFORMANCE_THRESHOLDS = {
  API_REQUEST: 1000,        // 1 second for API requests
  DATABASE_QUERY: 500,      // 500ms for data operations
  CALCULATION: 100,         // 100ms for calculations
  RENDER: 50,              // 50ms for component renders
  FILE_OPERATION: 200,     // 200ms for file I/O
} as const;

/**
 * Performance logger that tracks execution time and logs slow operations
 */
class PerformanceLogger {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Track the execution time of a function
   */
  async trackAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    threshold: number = PERFORMANCE_THRESHOLDS.API_REQUEST,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(operationName, duration, startTimestamp, threshold, context);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, startTimestamp, threshold, {
        ...context,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Track the execution time of a synchronous function
   */
  trackSync<T>(
    operationName: string,
    fn: () => T,
    threshold: number = PERFORMANCE_THRESHOLDS.CALCULATION,
    context?: Record<string, any>
  ): T {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();

    try {
      const result = fn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(operationName, duration, startTimestamp, threshold, context);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(operationName, duration, startTimestamp, threshold, {
        ...context,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(
    operationName: string,
    duration: number,
    timestamp: string,
    threshold: number,
    context?: Record<string, any>
  ): void {
    const isSlowOperation = duration > threshold;
    
    const metric: PerformanceMetric = {
      operationName,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimals
      timestamp,
      threshold,
      isSlowOperation,
      context,
    };

    // Add to metrics array
    this.metrics.push(metric);
    
    // Trim if exceeds max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log based on performance
    this.logMetric(metric);
  }

  /**
   * Log metric to console with appropriate level
   */
  private logMetric(metric: PerformanceMetric): void {
    const { operationName, duration, threshold, isSlowOperation, context } = metric;
    
    if (isSlowOperation) {
      const percentageOver = Math.round(((duration - threshold) / threshold) * 100);
      console.warn(
        `[PERFORMANCE WARNING] ${operationName} took ${duration}ms (${percentageOver}% over ${threshold}ms threshold)`,
        context || {}
      );
    } else if (process.env.NODE_ENV === 'development') {
      console.log(
        `[PERFORMANCE] ${operationName} took ${duration}ms (under ${threshold}ms threshold)`,
        context || {}
      );
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get slow operations (exceeding threshold)
   */
  getSlowOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => m.isSlowOperation);
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsByOperation(operationName: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.operationName === operationName);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operationName: string): number | null {
    const metrics = this.getMetricsByOperation(operationName);
    if (metrics.length === 0) return null;
    
    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return Math.round((total / metrics.length) * 100) / 100;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalOperations: number;
    slowOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
  } {
    const slowOps = this.getSlowOperations();
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = this.metrics.length > 0 
      ? Math.round((totalDuration / this.metrics.length) * 100) / 100 
      : 0;
    
    const slowestOperation = this.metrics.length > 0
      ? this.metrics.reduce((slowest, current) => 
          current.duration > slowest.duration ? current : slowest
        )
      : null;

    return {
      totalOperations: this.metrics.length,
      slowOperations: slowOps.length,
      averageDuration,
      slowestOperation,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Global singleton instance
const performanceLogger = new PerformanceLogger();

export { performanceLogger };

/**
 * Convenience function for tracking async operations
 */
export async function trackPerformance<T>(
  operationName: string,
  fn: () => Promise<T>,
  threshold?: number,
  context?: Record<string, any>
): Promise<T> {
  return performanceLogger.trackAsync(operationName, fn, threshold, context);
}

/**
 * Convenience function for tracking sync operations
 */
export function trackPerformanceSync<T>(
  operationName: string,
  fn: () => T,
  threshold?: number,
  context?: Record<string, any>
): T {
  return performanceLogger.trackSync(operationName, fn, threshold, context);
}
