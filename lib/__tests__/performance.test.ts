import { performanceLogger, trackPerformance, trackPerformanceSync, PERFORMANCE_THRESHOLDS } from '../performance';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceLogger.clear();
  });

  describe('trackPerformanceSync', () => {
    it('should track execution time of synchronous functions', () => {
      const result = trackPerformanceSync(
        'test-sync-operation',
        () => {
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          return sum;
        },
        PERFORMANCE_THRESHOLDS.CALCULATION
      );

      expect(result).toBe(499500);
      
      const metrics = performanceLogger.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operationName).toBe('test-sync-operation');
      expect(metrics[0].duration).toBeGreaterThan(0);
    });

    it('should identify slow synchronous operations', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Force a slow operation
      trackPerformanceSync(
        'slow-sync-operation',
        () => {
          const start = Date.now();
          while (Date.now() - start < 150) {
            // Busy wait for 150ms
          }
          return 'done';
        },
        PERFORMANCE_THRESHOLDS.CALCULATION // 100ms threshold
      );

      const slowOps = performanceLogger.getSlowOperations();
      expect(slowOps.length).toBeGreaterThan(0);
      expect(slowOps[0].isSlowOperation).toBe(true);
      expect(slowOps[0].duration).toBeGreaterThan(PERFORMANCE_THRESHOLDS.CALCULATION);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should handle errors in tracked functions', () => {
      expect(() => {
        trackPerformanceSync(
          'error-operation',
          () => {
            throw new Error('Test error');
          },
          PERFORMANCE_THRESHOLDS.CALCULATION
        );
      }).toThrow('Test error');

      const metrics = performanceLogger.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].context?.error).toBe('Test error');
    });

    it('should include context in metrics', () => {
      trackPerformanceSync(
        'context-operation',
        () => 42,
        PERFORMANCE_THRESHOLDS.CALCULATION,
        { userId: '123', action: 'calculate' }
      );

      const metrics = performanceLogger.getMetrics();
      expect(metrics[0].context).toEqual({
        userId: '123',
        action: 'calculate',
      });
    });
  });

  describe('trackPerformance (async)', () => {
    it('should track execution time of async functions', async () => {
      const result = await trackPerformance(
        'test-async-operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'completed';
        },
        PERFORMANCE_THRESHOLDS.API_REQUEST
      );

      expect(result).toBe('completed');
      
      const metrics = performanceLogger.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operationName).toBe('test-async-operation');
      expect(metrics[0].duration).toBeGreaterThanOrEqual(50);
    });

    it('should identify slow async operations', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      await trackPerformance(
        'slow-async-operation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 150));
          return 'done';
        },
        PERFORMANCE_THRESHOLDS.CALCULATION // 100ms threshold
      );

      const slowOps = performanceLogger.getSlowOperations();
      expect(slowOps.length).toBeGreaterThan(0);
      expect(slowOps[0].isSlowOperation).toBe(true);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should handle async errors', async () => {
      await expect(
        trackPerformance(
          'async-error-operation',
          async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw new Error('Async test error');
          },
          PERFORMANCE_THRESHOLDS.API_REQUEST
        )
      ).rejects.toThrow('Async test error');

      const metrics = performanceLogger.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].context?.error).toBe('Async test error');
    });
  });

  describe('PerformanceLogger', () => {
    it('should get metrics by operation name', () => {
      trackPerformanceSync('op1', () => 1, 100);
      trackPerformanceSync('op2', () => 2, 100);
      trackPerformanceSync('op1', () => 3, 100);

      const op1Metrics = performanceLogger.getMetricsByOperation('op1');
      expect(op1Metrics).toHaveLength(2);
      expect(op1Metrics.every(m => m.operationName === 'op1')).toBe(true);
    });

    it('should calculate average duration for an operation', () => {
      // Create operations with predictable durations
      trackPerformanceSync('test-op', () => {
        const start = Date.now();
        while (Date.now() - start < 10) {}
        return 1;
      }, 100);
      
      trackPerformanceSync('test-op', () => {
        const start = Date.now();
        while (Date.now() - start < 10) {}
        return 2;
      }, 100);

      const avg = performanceLogger.getAverageDuration('test-op');
      expect(avg).not.toBeNull();
      expect(avg!).toBeGreaterThan(0);
    });

    it('should return null for average of non-existent operation', () => {
      const avg = performanceLogger.getAverageDuration('non-existent');
      expect(avg).toBeNull();
    });

    it('should generate performance summary', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      trackPerformanceSync('fast-op', () => 1, 100);
      trackPerformanceSync('slow-op', () => {
        const start = Date.now();
        while (Date.now() - start < 150) {}
        return 2;
      }, 100);

      const summary = performanceLogger.getSummary();
      expect(summary.totalOperations).toBe(2);
      expect(summary.slowOperations).toBe(1);
      expect(summary.averageDuration).toBeGreaterThan(0);
      expect(summary.slowestOperation).not.toBeNull();
      expect(summary.slowestOperation!.operationName).toBe('slow-op');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should clear all metrics', () => {
      trackPerformanceSync('op1', () => 1, 100);
      trackPerformanceSync('op2', () => 2, 100);

      expect(performanceLogger.getMetrics()).toHaveLength(2);
      
      performanceLogger.clear();
      
      expect(performanceLogger.getMetrics()).toHaveLength(0);
      expect(performanceLogger.getSummary().totalOperations).toBe(0);
    });

    it('should limit metrics to max size', () => {
      // This test verifies the internal limit (1000 metrics)
      // We'll create more than that and verify trimming
      for (let i = 0; i < 1100; i++) {
        trackPerformanceSync(`operation-${i}`, () => i, 100);
      }

      const metrics = performanceLogger.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(1000);
      // Should keep the most recent ones
      expect(metrics[metrics.length - 1].operationName).toBe('operation-1099');
    });
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should have appropriate threshold values', () => {
      expect(PERFORMANCE_THRESHOLDS.API_REQUEST).toBe(1000);
      expect(PERFORMANCE_THRESHOLDS.DATABASE_QUERY).toBe(500);
      expect(PERFORMANCE_THRESHOLDS.CALCULATION).toBe(100);
      expect(PERFORMANCE_THRESHOLDS.RENDER).toBe(50);
      expect(PERFORMANCE_THRESHOLDS.FILE_OPERATION).toBe(200);
    });
  });

  describe('Real-world scenarios', () => {
    it('should track multiple operations concurrently', async () => {
      const operations = [
        trackPerformance('api-call-1', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'result1';
        }),
        trackPerformance('api-call-2', async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return 'result2';
        }),
        trackPerformance('api-call-3', async () => {
          await new Promise(resolve => setTimeout(resolve, 40));
          return 'result3';
        }),
      ];

      const results = await Promise.all(operations);
      expect(results).toEqual(['result1', 'result2', 'result3']);
      
      const metrics = performanceLogger.getMetrics();
      expect(metrics).toHaveLength(3);
    });

    it('should track nested operations', async () => {
      await trackPerformance(
        'outer-operation',
        async () => {
          const result1 = trackPerformanceSync('inner-sync', () => 1, 100);
          await trackPerformance('inner-async', async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
            return 2;
          }, 100);
          return result1;
        },
        PERFORMANCE_THRESHOLDS.API_REQUEST
      );

      const metrics = performanceLogger.getMetrics();
      expect(metrics).toHaveLength(3);
      expect(metrics.some(m => m.operationName === 'outer-operation')).toBe(true);
      expect(metrics.some(m => m.operationName === 'inner-sync')).toBe(true);
      expect(metrics.some(m => m.operationName === 'inner-async')).toBe(true);
    });

    it('should identify performance bottlenecks', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      // Simulate various operations
      trackPerformanceSync('fast-calculation', () => 42, 100);
      trackPerformanceSync('slow-calculation', () => {
        const start = Date.now();
        while (Date.now() - start < 150) {}
        return 42;
      }, 100);
      trackPerformanceSync('another-fast', () => 84, 100);

      const slowOps = performanceLogger.getSlowOperations();
      expect(slowOps).toHaveLength(1);
      expect(slowOps[0].operationName).toBe('slow-calculation');
      
      // This would alert SRE team
      expect(slowOps[0].isSlowOperation).toBe(true);
      expect(slowOps[0].duration).toBeGreaterThan(slowOps[0].threshold);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Metrics data structure', () => {
    it('should create properly structured performance metrics', () => {
      trackPerformanceSync(
        'structured-test',
        () => 'result',
        PERFORMANCE_THRESHOLDS.CALCULATION,
        { testId: '123' }
      );

      const metrics = performanceLogger.getMetrics();
      const metric = metrics[0];

      expect(metric).toHaveProperty('operationName');
      expect(metric).toHaveProperty('duration');
      expect(metric).toHaveProperty('timestamp');
      expect(metric).toHaveProperty('threshold');
      expect(metric).toHaveProperty('isSlowOperation');
      expect(metric).toHaveProperty('context');

      expect(typeof metric.operationName).toBe('string');
      expect(typeof metric.duration).toBe('number');
      expect(typeof metric.timestamp).toBe('string');
      expect(typeof metric.threshold).toBe('number');
      expect(typeof metric.isSlowOperation).toBe('boolean');
      expect(typeof metric.context).toBe('object');
    });

    it('should round duration to 2 decimal places', () => {
      trackPerformanceSync('rounding-test', () => {
        const start = Date.now();
        while (Date.now() - start < 5) {}
        return 'done';
      }, 100);

      const metrics = performanceLogger.getMetrics();
      const durationStr = metrics[0].duration.toString();
      const decimalPlaces = durationStr.includes('.') 
        ? durationStr.split('.')[1].length 
        : 0;
      
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });
});
