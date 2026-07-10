import { logger } from '../logger';

describe('logger', () => {
  const ORIGINAL_ENV = { ...process.env };
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    process.env = { ...ORIGINAL_ENV };
  });

  describe('level routing', () => {
    it('routes info and debug to console.log', () => {
      process.env.LOG_LEVEL = 'debug';
      logger.info('hello info');
      logger.debug('hello debug');
      expect(logSpy).toHaveBeenCalledTimes(2);
    });

    it('routes warn to console.warn', () => {
      logger.warn('careful');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('routes error to console.error', () => {
      logger.error('boom');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('level filtering', () => {
    it('suppresses entries below the configured LOG_LEVEL', () => {
      process.env.LOG_LEVEL = 'warn';
      logger.debug('should be hidden');
      logger.info('should be hidden');
      logger.warn('should show');
      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('emits debug when LOG_LEVEL is debug', () => {
      process.env.LOG_LEVEL = 'debug';
      logger.debug('visible');
      expect(logSpy).toHaveBeenCalledTimes(1);
    });

    it('suppresses debug by default outside development', () => {
      delete process.env.LOG_LEVEL;
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      logger.debug('hidden by default');
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('output format', () => {
    it('emits a single JSON line in production', () => {
      delete process.env.LOG_LEVEL;
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      logger.error('order failed', { requestId: 'req-123', orderId: 'order-1' });

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [serialized] = errorSpy.mock.calls[0];
      const parsed = JSON.parse(serialized as string);
      expect(parsed).toMatchObject({
        level: 'error',
        message: 'order failed',
        requestId: 'req-123',
        orderId: 'order-1',
      });
      expect(typeof parsed.timestamp).toBe('string');
    });

    it('emits a readable prefix with context in development', () => {
      delete process.env.LOG_LEVEL;
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      logger.info('cart loaded', { itemCount: 3 });

      expect(logSpy).toHaveBeenCalledWith('[INFO] cart loaded', { itemCount: 3 });
    });

    it('passes an empty context object when none is provided in development', () => {
      delete process.env.LOG_LEVEL;
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      logger.warn('no context');

      expect(warnSpy).toHaveBeenCalledWith('[WARN] no context', {});
    });
  });
});
