export async function register() {
  // Keep Node-only imports inside this branch so Next.js omits them from Edge bundles.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
      return;
    }

    const { useAzureMonitor: initializeAzureMonitor } = await import(
      '@azure/monitor-opentelemetry'
    );
    initializeAzureMonitor();
  }
}