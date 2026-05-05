import { getVersion } from '../version';

describe('getVersion', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return the APP_VERSION env var', () => {
    process.env.APP_VERSION = '1.2.3';
    const version = getVersion();
    expect(version).toBe('1.2.3');
  });

  it('should return 0.0.0 when APP_VERSION is not set', () => {
    delete process.env.APP_VERSION;
    const version = getVersion();
    expect(version).toBe('0.0.0');
  });

  it('should return 0.0.0 when APP_VERSION is empty', () => {
    process.env.APP_VERSION = '';
    const version = getVersion();
    expect(version).toBe('0.0.0');
  });
});
