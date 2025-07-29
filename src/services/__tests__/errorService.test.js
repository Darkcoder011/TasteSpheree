import { vi, beforeEach, afterEach } from 'vitest';
import errorService from '../errorService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-agent',
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
    location: {
      href: 'http://localhost:3000'
    },
    addEventListener: vi.fn()
  },
  writable: true
});

describe('ErrorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorService.clearErrors();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('logs an error with basic information', () => {
      const error = new Error('Test error');
      const errorId = errorService.logError(error);

      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');

      const recentErrors = errorService.getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].message).toBe('Test error');
      expect(recentErrors[0].name).toBe('Error');
    });

    it('logs error with context information', () => {
      const error = new Error('Test error');
      const context = { type: 'test', component: 'TestComponent' };
      
      errorService.logError(error, context);

      const recentErrors = errorService.getRecentErrors(1);
      expect(recentErrors[0].context).toEqual(context);
    });

    it('includes environment information', () => {
      const error = new Error('Test error');
      
      errorService.logError(error);

      const recentErrors = errorService.getRecentErrors(1);
      expect(recentErrors[0].userAgent).toBe('test-agent');
      expect(recentErrors[0].url).toBe('http://localhost:3000');
      expect(recentErrors[0].timestamp).toBeDefined();
    });

    it('stores errors in localStorage', () => {
      const error = new Error('Test error');
      
      errorService.logError(error);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'tastesphere-errors',
        expect.any(String)
      );
    });
  });

  describe('logBoundaryError', () => {
    it('logs React error boundary errors', () => {
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'Component stack trace' };
      const componentName = 'TestComponent';

      const errorId = errorService.logBoundaryError(error, errorInfo, componentName);

      expect(errorId).toBeDefined();

      const recentErrors = errorService.getRecentErrors(1);
      expect(recentErrors[0].context.type).toBe('boundary');
      expect(recentErrors[0].context.componentName).toBe(componentName);
      expect(recentErrors[0].context.componentStack).toBe('Component stack trace');
      expect(recentErrors[0].context.errorBoundary).toBe(true);
    });
  });

  describe('logApiError', () => {
    it('logs API errors with request details', () => {
      const error = new Error('API error');
      error.status = 500;
      error.statusText = 'Internal Server Error';
      
      const endpoint = '/api/test';
      const method = 'POST';
      const requestData = { test: 'data' };

      const errorId = errorService.logApiError(error, endpoint, method, requestData);

      expect(errorId).toBeDefined();

      const recentErrors = errorService.getRecentErrors(1);
      expect(recentErrors[0].context.type).toBe('api');
      expect(recentErrors[0].context.endpoint).toBe(endpoint);
      expect(recentErrors[0].context.method).toBe(method);
      expect(recentErrors[0].context.requestData).toEqual(requestData);
      expect(recentErrors[0].context.status).toBe(500);
      expect(recentErrors[0].context.statusText).toBe('Internal Server Error');
    });
  });

  describe('logNetworkError', () => {
    it('logs network errors with connection info', () => {
      const error = new Error('Network error');
      const context = { url: 'https://api.example.com' };

      const errorId = errorService.logNetworkError(error, context);

      expect(errorId).toBeDefined();

      const recentErrors = errorService.getRecentErrors(1);
      expect(recentErrors[0].context.type).toBe('network');
      expect(recentErrors[0].context.url).toBe('https://api.example.com');
      expect(recentErrors[0].context.online).toBe(true);
      expect(recentErrors[0].context.connection).toEqual({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100
      });
    });
  });

  describe('getErrorsByType', () => {
    it('filters errors by type', () => {
      const apiError = new Error('API error');
      const networkError = new Error('Network error');

      errorService.logApiError(apiError, '/api/test');
      errorService.logNetworkError(networkError);

      const apiErrors = errorService.getErrorsByType('api');
      const networkErrors = errorService.getErrorsByType('network');

      expect(apiErrors).toHaveLength(1);
      expect(networkErrors).toHaveLength(1);
      expect(apiErrors[0].message).toBe('API error');
      expect(networkErrors[0].message).toBe('Network error');
    });
  });

  describe('getErrorStats', () => {
    it('returns error statistics', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');

      errorService.logError(error1, { type: 'test' });
      errorService.logApiError(error2, '/api/test');

      const stats = errorService.getErrorStats();

      expect(stats.total).toBe(2);
      expect(stats.byType.test).toBe(1);
      expect(stats.byType.api).toBe(1);
      expect(stats.mostRecent).toBeDefined();
    });
  });

  describe('clearErrors', () => {
    it('clears all errors', () => {
      const error = new Error('Test error');
      errorService.logError(error);

      expect(errorService.getRecentErrors()).toHaveLength(1);

      errorService.clearErrors();

      expect(errorService.getRecentErrors()).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('tastesphere-errors');
    });
  });

  describe('exportErrors', () => {
    it('exports error data', () => {
      const error = new Error('Test error');
      errorService.logError(error);

      const exported = errorService.exportErrors();

      expect(exported.errors).toHaveLength(1);
      expect(exported.stats).toBeDefined();
      expect(exported.exportedAt).toBeDefined();
      expect(exported.version).toBe('1.0.0');
    });
  });

  describe('error limits', () => {
    it('limits the number of stored errors', () => {
      // Set a lower limit for testing
      errorService.maxErrors = 3;

      for (let i = 0; i < 5; i++) {
        errorService.logError(new Error(`Error ${i}`));
      }

      const errors = errorService.getRecentErrors(10);
      expect(errors).toHaveLength(3);
      expect(errors[0].message).toBe('Error 4'); // Most recent
      expect(errors[2].message).toBe('Error 2'); // Oldest kept
    });
  });
});