import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest';
import { Logger } from '../logger';

describe('Structured Logger (AGENTS.md Rule 25 & 26)', () => {
  let stdoutSpy: MockInstance;
  let stderrSpy: MockInstance;
  let warnSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should emit structured JSON with level and message', () => {
    const logger = new Logger({}, 'info');
    logger.info('Test log message');

    expect(stdoutSpy).toHaveBeenCalled();
    const emitted = JSON.parse(stdoutSpy.mock.calls[0]![0] as string);
    expect(emitted.level).toBe('info');
    expect(emitted.message).toBe('Test log message');
    expect(emitted.timestamp).toBeDefined();
  });

  it('should scrub sensitive fields (passwords, tokens) automatically', () => {
    const logger = new Logger({}, 'info');
    logger.info('User action', {
      userId: '123',
      password: 'SuperSecretPassword!',
      token: 'bearer-token-value',
      authorization: 'Basic secret',
    });

    expect(stdoutSpy).toHaveBeenCalled();
    const emitted = JSON.parse(stdoutSpy.mock.calls[0]![0] as string);
    expect(emitted.context.password).toBe('[REDACTED]');
    expect(emitted.context.token).toBe('[REDACTED]');
    expect(emitted.context.authorization).toBe('[REDACTED]');
    expect(emitted.context.userId).toBe('123');
  });

  it('should route errors to stderr and include error details', () => {
    const logger = new Logger({}, 'debug');
    const testError = new Error('Database connection failed');
    logger.error('Failed query', testError, { queryId: 'q-99' });

    expect(stderrSpy).toHaveBeenCalled();
    const emitted = JSON.parse(stderrSpy.mock.calls[0]![0] as string);
    expect(emitted.level).toBe('error');
    expect(emitted.context.errorMessage).toBe('Database connection failed');
    expect(emitted.context.queryId).toBe('q-99');
  });

  it('should respect minimum log levels and suppress lower priority logs', () => {
    const logger = new Logger({}, 'error');
    logger.info('Should not be logged');
    logger.warn('Should not be logged');

    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();

    logger.error('Critical failure');
    expect(stderrSpy).toHaveBeenCalled();
  });
});
