import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PerformanceMonitor from '../PerformanceMonitor';
import { performanceLogger, trackPerformanceSync, PERFORMANCE_THRESHOLDS } from '@/lib/performance';

// Mock the performance logger
jest.mock('@/lib/performance', () => {
  const actual = jest.requireActual('@/lib/performance');
  return {
    ...actual,
    performanceLogger: {
      getMetrics: jest.fn(() => []),
      getSummary: jest.fn(() => ({
        totalOperations: 0,
        slowOperations: 0,
        averageDuration: 0,
        slowestOperation: null,
      })),
      clear: jest.fn(),
    },
  };
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render as a floating button when closed', () => {
    render(<PerformanceMonitor />);
    
    const button = screen.getByTitle('Open Performance Monitor');
    expect(button).toBeInTheDocument();
  });

  it('should open the monitor when button is clicked', () => {
    render(<PerformanceMonitor />);
    
    const openButton = screen.getByTitle('Open Performance Monitor');
    fireEvent.click(openButton);
    
    expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
  });

  it('should close the monitor when close button is clicked', () => {
    render(<PerformanceMonitor />);
    
    // Open monitor
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));
    expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
    
    // Close monitor
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument();
  });

  it('should display summary statistics', () => {
    const mockSummary = {
      totalOperations: 42,
      slowOperations: 5,
      averageDuration: 123.45,
      slowestOperation: null,
    };

    (performanceLogger.getSummary as jest.Mock).mockReturnValue(mockSummary);

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    expect(screen.getByText('42')).toBeInTheDocument(); // Total operations
    expect(screen.getByText('5')).toBeInTheDocument(); // Slow operations
    expect(screen.getByText('123.45ms')).toBeInTheDocument(); // Avg duration
  });

  it('should display slowest operation duration', () => {
    const mockSummary = {
      totalOperations: 10,
      slowOperations: 1,
      averageDuration: 50,
      slowestOperation: {
        operationName: 'slow-api-call',
        duration: 1500,
        timestamp: new Date().toISOString(),
        threshold: 1000,
        isSlowOperation: true,
      },
    };

    (performanceLogger.getSummary as jest.Mock).mockReturnValue(mockSummary);

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    expect(screen.getByText('1500ms')).toBeInTheDocument();
  });

  it('should display recent metrics', () => {
    const mockMetrics = [
      {
        operationName: 'API:GET:/api/menu',
        duration: 125.5,
        timestamp: new Date().toISOString(),
        threshold: 1000,
        isSlowOperation: false,
        context: { endpoint: '/api/menu' },
      },
      {
        operationName: 'calculateCartTotals',
        duration: 15.2,
        timestamp: new Date().toISOString(),
        threshold: 100,
        isSlowOperation: false,
      },
    ];

    (performanceLogger.getMetrics as jest.Mock).mockReturnValue(mockMetrics);

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    expect(screen.getByText('API:GET:/api/menu')).toBeInTheDocument();
    expect(screen.getByText('calculateCartTotals')).toBeInTheDocument();
    expect(screen.getByText('125.5ms')).toBeInTheDocument();
    expect(screen.getByText('15.2ms')).toBeInTheDocument();
  });

  it('should show "no operations" message when no metrics', () => {
    (performanceLogger.getMetrics as jest.Mock).mockReturnValue([]);

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    expect(screen.getByText('No operations tracked yet')).toBeInTheDocument();
  });

  it('should highlight slow operations in red', () => {
    const mockMetrics = [
      {
        operationName: 'slow-operation',
        duration: 1500,
        timestamp: new Date().toISOString(),
        threshold: 1000,
        isSlowOperation: true,
      },
    ];

    (performanceLogger.getMetrics as jest.Mock).mockReturnValue(mockMetrics);
    (performanceLogger.getSummary as jest.Mock).mockReturnValue({
      totalOperations: 1,
      slowOperations: 1,
      averageDuration: 1500,
      slowestOperation: mockMetrics[0],
    });

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    // Find the parent div with the bg-red-50 class
    const slowOpText = screen.getByText('slow-operation');
    let metricCard = slowOpText.parentElement;
    while (metricCard && !metricCard.className.includes('bg-red-50')) {
      metricCard = metricCard.parentElement;
    }
    expect(metricCard).toHaveClass('bg-red-50');
  });

  it('should display metric context information', () => {
    const mockMetrics = [
      {
        operationName: 'test-op',
        duration: 50,
        timestamp: new Date().toISOString(),
        threshold: 100,
        isSlowOperation: false,
        context: {
          endpoint: '/api/test',
          userId: '123',
        },
      },
    ];

    (performanceLogger.getMetrics as jest.Mock).mockReturnValue(mockMetrics);

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    expect(screen.getByText(/endpoint:/)).toBeInTheDocument();
    expect(screen.getByText(/userId:/)).toBeInTheDocument();
  });

  it('should clear metrics when clear button is clicked', () => {
    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    const clearButton = screen.getByText('Clear Metrics');
    fireEvent.click(clearButton);

    expect(performanceLogger.clear).toHaveBeenCalled();
  });

  it('should export metrics data when export button is clicked', () => {
    const mockMetrics = [
      {
        operationName: 'test-op',
        duration: 50,
        timestamp: new Date().toISOString(),
        threshold: 100,
        isSlowOperation: false,
      },
    ];

    (performanceLogger.getMetrics as jest.Mock).mockReturnValue(mockMetrics);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    
    // Mock createElement more properly
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const elem = originalCreateElement('a');
        elem.click = mockClick;
        return elem;
      }
      return originalCreateElement(tagName);
    });

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    
    // Restore
    (document.createElement as jest.Mock).mockRestore();
  });

  it('should update metrics at specified refresh interval', async () => {
    const mockMetrics = [
      {
        operationName: 'initial-op',
        duration: 50,
        timestamp: new Date().toISOString(),
        threshold: 100,
        isSlowOperation: false,
      },
    ];

    (performanceLogger.getMetrics as jest.Mock).mockReturnValue(mockMetrics);

    render(<PerformanceMonitor refreshInterval={100} />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    expect(performanceLogger.getMetrics).toHaveBeenCalledTimes(1);

    // Wait for refresh interval
    await waitFor(() => {
      expect(performanceLogger.getMetrics).toHaveBeenCalledTimes(2);
    }, { timeout: 200 });
  });

  it('should show percentage over threshold for slow operations', () => {
    const mockMetrics = [
      {
        operationName: 'slow-op',
        duration: 1500,
        timestamp: new Date().toISOString(),
        threshold: 1000,
        isSlowOperation: true,
      },
    ];

    (performanceLogger.getMetrics as jest.Mock).mockReturnValue(mockMetrics);
    (performanceLogger.getSummary as jest.Mock).mockReturnValue({
      totalOperations: 1,
      slowOperations: 1,
      averageDuration: 1500,
      slowestOperation: mockMetrics[0],
    });

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    // 1500ms is 50% over 1000ms threshold
    expect(screen.getByText('+50%')).toBeInTheDocument();
  });

  it('should display metrics in reverse chronological order', () => {
    const now = Date.now();
    const mockMetrics = [
      {
        operationName: 'op-1',
        duration: 10,
        timestamp: new Date(now - 3000).toISOString(),
        threshold: 100,
        isSlowOperation: false,
      },
      {
        operationName: 'op-2',
        duration: 20,
        timestamp: new Date(now - 2000).toISOString(),
        threshold: 100,
        isSlowOperation: false,
      },
      {
        operationName: 'op-3',
        duration: 30,
        timestamp: new Date(now - 1000).toISOString(),
        threshold: 100,
        isSlowOperation: false,
      },
    ];

    (performanceLogger.getMetrics as jest.Mock).mockReturnValue(mockMetrics);
    (performanceLogger.getSummary as jest.Mock).mockReturnValue({
      totalOperations: 3,
      slowOperations: 0,
      averageDuration: 20,
      slowestOperation: mockMetrics[2],
    });

    render(<PerformanceMonitor />);
    fireEvent.click(screen.getByTitle('Open Performance Monitor'));

    const operations = screen.getAllByText(/^op-/);
    // Most recent (op-3) should appear first
    expect(operations[0]).toHaveTextContent('op-3');
    expect(operations[1]).toHaveTextContent('op-2');
    expect(operations[2]).toHaveTextContent('op-1');
  });
});
