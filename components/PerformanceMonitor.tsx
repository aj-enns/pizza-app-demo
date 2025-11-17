'use client';

import { useState, useEffect } from 'react';
import { performanceLogger } from '@/lib/performance';
import type { PerformanceMetric } from '@/lib/performance';
import { X, Activity, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface PerformanceMonitorProps {
  refreshInterval?: number; // milliseconds
}

export default function PerformanceMonitor({ refreshInterval = 2000 }: PerformanceMonitorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = useState({
    totalOperations: 0,
    slowOperations: 0,
    averageDuration: 0,
    slowestOperation: null as PerformanceMetric | null,
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateMetrics = () => {
      setMetrics(performanceLogger.getMetrics());
      setSummary(performanceLogger.getSummary());
    };

    // Initial update
    updateMetrics();

    // Set up interval
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [isOpen, refreshInterval]);

  const slowOperations = metrics.filter(m => m.isSlowOperation);
  const recentMetrics = metrics.slice(-10).reverse(); // Last 10 operations

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        title="Open Performance Monitor"
      >
        <Activity className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden z-50 flex flex-col">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h3 className="font-semibold">Performance Monitor</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary-700 p-1 rounded transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-xs text-gray-600 mb-1">Total Operations</div>
          <div className="text-2xl font-bold text-gray-900">{summary.totalOperations}</div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Slow Operations
          </div>
          <div className={`text-2xl font-bold ${summary.slowOperations > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {summary.slowOperations}
          </div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Avg Duration
          </div>
          <div className="text-lg font-bold text-gray-900">{summary.averageDuration}ms</div>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Slowest
          </div>
          <div className="text-lg font-bold text-gray-900">
            {summary.slowestOperation ? `${summary.slowestOperation.duration}ms` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <TabButton active label="Recent" />
        <TabButton label={`Slow (${slowOperations.length})`} />
      </div>

      {/* Metrics List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {recentMetrics.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No operations tracked yet
          </div>
        ) : (
          recentMetrics.map((metric, index) => (
            <MetricCard key={`${metric.operationName}-${metric.timestamp}-${index}`} metric={metric} />
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
        <button
          onClick={() => {
            performanceLogger.clear();
            setMetrics([]);
            setSummary({
              totalOperations: 0,
              slowOperations: 0,
              averageDuration: 0,
              slowestOperation: null,
            });
          }}
          className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Clear Metrics
        </button>
        <button
          onClick={() => {
            const data = JSON.stringify(metrics, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance-metrics-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
        >
          Export Data
        </button>
      </div>
    </div>
  );
}

function TabButton({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function MetricCard({ metric }: { metric: PerformanceMetric }) {
  const percentOver = metric.isSlowOperation
    ? Math.round(((metric.duration - metric.threshold) / metric.threshold) * 100)
    : 0;

  return (
    <div
      className={`p-3 rounded border ${
        metric.isSlowOperation
          ? 'bg-red-50 border-red-300'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate" title={metric.operationName}>
            {metric.operationName}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(metric.timestamp).toLocaleTimeString()}
          </div>
        </div>
        <div className="text-right ml-2">
          <div
            className={`text-lg font-bold ${
              metric.isSlowOperation ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {metric.duration}ms
          </div>
          {metric.isSlowOperation && (
            <div className="text-xs text-red-600">+{percentOver}%</div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
        <div
          className={`h-1.5 rounded-full ${
            metric.isSlowOperation ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{
            width: `${Math.min((metric.duration / metric.threshold) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Context */}
      {metric.context && Object.keys(metric.context).length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          {Object.entries(metric.context).map(([key, value]) => (
            <div key={key} className="truncate">
              <span className="font-medium">{key}:</span> {JSON.stringify(value)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
