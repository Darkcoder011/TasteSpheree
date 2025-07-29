import { vi, beforeEach, afterEach } from 'vitest';
import networkService from '../networkService';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100
    }
  },
  writable: true
});

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

describe('NetworkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    networkService.retryAttempts.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('network status', () => {
    it('returns current network status', () => {
      const status = networkService.getNetworkStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.connection).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: undefined
      });
    });

    it('handles missing connection info', () => {
      const originalConnection = navigator.connection;
      delete navigator.connection;
      
      const status = networkService.getNetworkStatus();
      
      expect(status.isOnline).toBe(true);
      expect(status.connection).toBeNull();
      
      navigator.connection = originalConnection;
    });
  });

  describe('retry logic', () => {
    it('calculates exponential backoff delay', () => {
      const delay1 = networkService.calculateDelay(0);
      const delay2 = networkService.calculateDelay(1);
      const delay3 = networkService.calculateDelay(2);
      
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThanOrEqual(1100); // 1000 + 10% jitter
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThanOrEqual(2200);
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThanOrEqual(4400);
    });

    it('caps delay at maximum', () => {
      const delay = networkService.calculateDelay(10);
      expect(delay).toBeLessThanOrEqual(30000);
    });

    it('tracks retry attempts', () => {
      const url = 'https://api.example.com';
      
      expect(networkService.getRetryCount(url)).toBe(0);
      
      networkService.incrementRetryCount(url);
      expect(networkService.getRetryCount(url)).toBe(1);
      
      networkService.incrementRetryCount(url);
      expect(networkService.getRetryCount(url)).toBe(2);
      
      networkService.resetRetryCount(url);
      expect(networkService.getRetryCount(url)).toBe(0);
    });
  });

  describe('error classification', () => {
    it('identifies retryable errors', () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      expect(networkService.isRetryableError(networkError)).toBe(true);

      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      expect(networkService.isRetryableError(timeoutError)).toBe(true);

      const serverError = new Error('Server error');
      serverError.status = 500;
      expect(networkService.isRetryableError(serverError)).toBe(true);

      const rateLimitError = new Error('Rate limited');
      rateLimitError.status = 429;
      expect(networkService.isRetryableError(rateLimitError)).toBe(true);
    });

    it('identifies non-retryable errors', () => {
      const authError = new Error('Unauthorized');
      authError.status = 401;
      expect(networkService.isRetryableError(authError)).toBe(false);

      const notFoundError = new Error('Not found');
      notFoundError.status = 404;
      expect(networkService.isRetryableError(notFoundError)).toBe(false);

      const validationError = new Error('Validation error');
      validationError.status = 400;
      expect(networkService.isRetryableError(validationError)).toBe(false);
    });
  });

  describe('shouldRetry', () => {
    it('returns false for non-retryable errors', () => {
      const authError = new Error('Unauthorized');
      authError.status = 401;
      
      expect(networkService.shouldRetry(authError, 'https://api.example.com')).toBe(false);
    });

    it('returns false when max retries exceeded', () => {
      const url = 'https://api.example.com';
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      // Simulate max retries reached
      for (let i = 0; i < 3; i++) {
        networkService.incrementRetryCount(url);
      }
      
      expect(networkService.shouldRetry(networkError, url)).toBe(false);
    });

    it('returns false when offline', () => {
      networkService.isOnline = false;
      
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      expect(networkService.shouldRetry(networkError, 'https://api.example.com')).toBe(false);
      
      networkService.isOnline = true;
    });

    it('returns true for retryable errors within limits', () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      expect(networkService.shouldRetry(networkError, 'https://api.example.com')).toBe(true);
    });
  });

  describe('executeWithRetry', () => {
    it('succeeds on first attempt', async () => {
      const mockResult = { data: 'success' };
      const requestFn = vi.fn().mockResolvedValue(mockResult);
      
      const result = await networkService.executeWithRetry(
        requestFn,
        'https://api.example.com'
      );
      
      expect(result).toBe(mockResult);
      expect(requestFn).toHaveBeenCalledTimes(1);
    });

    it('retries on retryable errors', async () => {
      const mockResult = { data: 'success' };
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const requestFn = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue(mockResult);
      
      const result = await networkService.executeWithRetry(
        requestFn,
        'https://api.example.com'
      );
      
      expect(result).toBe(mockResult);
      expect(requestFn).toHaveBeenCalledTimes(3);
    });

    it('calls retry callback', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const requestFn = vi.fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ data: 'success' });
      
      const onRetry = vi.fn();
      
      await networkService.executeWithRetry(
        requestFn,
        'https://api.example.com',
        'GET',
        { onRetry }
      );
      
      expect(onRetry).toHaveBeenCalledWith(
        networkError,
        1,
        expect.any(Number)
      );
    });

    it('fails after max retries', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      
      const requestFn = vi.fn().mockRejectedValue(networkError);
      const onError = vi.fn();
      
      await expect(
        networkService.executeWithRetry(
          requestFn,
          'https://api.example.com',
          'GET',
          { onError }
        )
      ).rejects.toThrow('Network error');
      
      expect(requestFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
      expect(onError).toHaveBeenCalledWith(networkError, 4);
    });
  });

  describe('fetch wrapper', () => {
    it('makes successful request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'success' })
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      const result = await networkService.fetch('https://api.example.com');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
      expect(result).toEqual({ data: 'success' });
    });

    it('handles HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Server error')
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      await expect(
        networkService.fetch('https://api.example.com')
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('handles timeout', async () => {
      fetch.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        })
      );
      
      await expect(
        networkService.fetch('https://api.example.com', { timeout: 50 })
      ).rejects.toThrow('Request timeout');
    });
  });

  describe('connectivity test', () => {
    it('returns true for successful connection', async () => {
      const mockResponse = { ok: true };
      fetch.mockResolvedValue(mockResponse);
      
      const result = await networkService.testConnectivity();
      
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        '/favicon.ico',
        expect.objectContaining({
          method: 'HEAD',
          cache: 'no-cache'
        })
      );
    });

    it('returns false for failed connection', async () => {
      fetch.mockRejectedValue(new Error('Network error'));
      
      const result = await networkService.testConnectivity();
      
      expect(result).toBe(false);
    });
  });

  describe('error messages', () => {
    it('returns offline message when offline', () => {
      networkService.isOnline = false;
      
      const error = new Error('Network error');
      const message = networkService.getErrorMessage(error);
      
      expect(message).toBe('You appear to be offline. Please check your internet connection.');
      
      networkService.isOnline = true;
    });

    it('returns timeout message for timeout errors', () => {
      const error = new Error('Timeout');
      error.name = 'TimeoutError';
      
      const message = networkService.getErrorMessage(error);
      
      expect(message).toBe('Request timed out. Please try again.');
    });

    it('returns rate limit message', () => {
      const error = new Error('Rate limited');
      error.status = 429;
      
      const message = networkService.getErrorMessage(error);
      
      expect(message).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('returns server error message', () => {
      const error = new Error('Server error');
      error.status = 500;
      
      const message = networkService.getErrorMessage(error);
      
      expect(message).toBe('The service is temporarily unavailable. Please try again later.');
    });

    it('returns auth error message', () => {
      const error = new Error('Unauthorized');
      error.status = 401;
      
      const message = networkService.getErrorMessage(error);
      
      expect(message).toBe('Authentication error. Please check your API configuration.');
    });
  });
});