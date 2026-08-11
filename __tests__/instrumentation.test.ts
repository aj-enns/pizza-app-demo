import { useAzureMonitor } from '@azure/monitor-opentelemetry';
import { register } from '@/instrumentation';

jest.mock('@azure/monitor-opentelemetry', () => ({
  useAzureMonitor: jest.fn(),
}));

const mockUseAzureMonitor = jest.mocked(useAzureMonitor);
const originalNextRuntime = process.env.NEXT_RUNTIME;
const originalConnectionString =
  process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

describe('Application Insights instrumentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_RUNTIME = 'nodejs';
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING =
      'InstrumentationKey=test-key';
  });

  afterAll(() => {
    if (originalNextRuntime === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = originalNextRuntime;
    }

    if (originalConnectionString === undefined) {
      delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    } else {
      process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = originalConnectionString;
    }
  });

  it('initializes Azure Monitor in the Node.js runtime when configured', async () => {
    await register();

    expect(mockUseAzureMonitor).toHaveBeenCalledTimes(1);
  });

  it('does not initialize Azure Monitor without a connection string', async () => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

    await register();

    expect(mockUseAzureMonitor).not.toHaveBeenCalled();
  });

  it('does not initialize Azure Monitor in the Edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';

    await register();

    expect(mockUseAzureMonitor).not.toHaveBeenCalled();
  });
});