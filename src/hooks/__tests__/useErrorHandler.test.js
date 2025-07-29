import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useErrorHandler } from '../useErrorHandler';
import errorService from '../../services/errorService';

// Mock the error service
vi.mock('../../services/errorService', () => ({
  default: {
    logError: vi.fn(),
    logApiError: vi.fn(),
    logNetworkError: vi.fn(),
    logBoundaryError: vi.fn(),
    getErrorStats: vi.fn(),
    getRecentErrors: vi.fn(),
    clearErrors: vi.fn(),
    exportErrors: vi.fn()
  }
}));

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    onLine: true
  },
  writable: true
});

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleError', () => {
    it('logs error and returns error info', () => {
      const mockErrorId = 'error-123';
      errorService.logError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      const errorInfo = result.current.handleError(error, context);

      expect(errorService.logError).toHaveBeenCalledWith(error, context);
      expect(errorInfo).toEqual({
        errorId: mockErrorId,
        message: 'Test error',
        canRetry: true,
        timestamp: expect.any(String)
      });
    });

    it('handles error without message', () => {
      const mockErrorId = 'error-123';
      errorService.logError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = {};

      const errorInfo = result.current.handleError(error);

      expect(errorInfo.message).toBe('An unexpected error occurred');
    });

    it('respects canRetry context option', () => {
      const mockErrorId = 'error-123';
      errorService.logError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error');
      const context = { canRetry: false };

      const errorInfo = result.current.handleError(error, context);

      expect(errorInfo.canRetry).toBe(false);
    });
  });

  describe('handleApiError', () => {
    it('logs API error and returns user-friendly message', () => {
      const mockErrorId = 'api-error-123';
      errorService.logApiError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('API error');
      error.status = 500;
      
      const endpoint = '/api/test';
      const method = 'POST';
      const requestData = { test: 'data' };

      const errorInfo = result.current.handleApiError(error, endpoint, method, requestData);

      expect(errorService.logApiError).toHaveBeenCalledWith(error, endpoint, method, requestData);
      expect(errorInfo).toEqual({
        errorId: mockErrorId,
        message: 'The service is temporarily unavailable. Please try again later.',
        originalError: error,
        canRetry: true,
        retryAfter: 5000,
        timestamp: expect.any(String)
      });
    });

    it('handles network errors', () => {
      const mockErrorId = 'network-error-123';
      errorService.logApiError.mockReturnValue(mockErrorId);
      
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Network error');
      error.name = 'NetworkError';

      const errorInfo = result.current.handleApiError(error, '/api/test');

      expect(errorInfo.message).toBe('Please check your internet connection and try again.');
    });

    it('handles rate limiting errors', () => {
      const mockErrorId = 'rate-limit-error-123';
      errorService.logApiError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Rate limited');
      error.status = 429;

      const errorInfo = result.current.handleApiError(error, '/api/test');

      expect(errorInfo.message).toBe('Too many requests. Please wait a moment and try again.');
      expect(errorInfo.retryAfter).toBe(60000);
    });

    it('handles authentication errors', () => {
      const mockErrorId = 'auth-error-123';
      errorService.logApiError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Unauthorized');
      error.status = 401;

      const errorInfo = result.current.handleApiError(error, '/api/test');

      expect(errorInfo.message).toBe('Authentication error. Please check your API configuration.');
      expect(errorInfo.canRetry).toBe(false);
    });
  });

  describe('handleNetworkError', () => {
    it('logs network error and returns appropriate message', () => {
      const mockErrorId = 'network-error-123';
      errorService.logNetworkError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Network error');
      const context = { url: 'https://api.example.com' };

      const errorInfo = result.current.handleNetworkError(error, context);

      expect(errorService.logNetworkError).toHaveBeenCalledWith(error, context);
      expect(errorInfo).toEqual({
        errorId: mockErrorId,
        message: 'Network error occurred.',
        originalError: error,
        canRetry: true,
        retryAfter: 3000,
        timestamp: expect.any(String)
      });
    });

    it('handles offline state', () => {
      const mockErrorId = 'offline-error-123';
      errorService.logNetworkError.mockReturnValue(mockErrorId);
      
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Network error');

      const errorInfo = result.current.handleNetworkError(error);

      expect(errorInfo.message).toBe('You appear to be offline. Please check your internet connection.');
    });

    it('handles timeout errors', () => {
      const mockErrorId = 'timeout-error-123';
      errorService.logNetworkError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Timeout');
      error.name = 'TimeoutError';

      const errorInfo = result.current.handleNetworkError(error);

      expect(errorInfo.message).toBe('Request timed out. Please try again.');
    });
  });

  describe('handleBoundaryError', () => {
    it('logs boundary error and returns error info', () => {
      const mockErrorId = 'boundary-error-123';
      errorService.logBoundaryError.mockReturnValue(mockErrorId);

      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'Component stack' };
      const componentName = 'TestComponent';

      const result_info = result.current.handleBoundaryError(error, errorInfo, componentName);

      expect(errorService.logBoundaryError).toHaveBeenCalledWith(error, errorInfo, componentName);
      expect(result_info).toEqual({
        errorId: mockErrorId,
        message: 'An error occurred in the TestComponent component.',
        originalError: error,
        canRetry: true,
        timestamp: expect.any(String)
      });
    });
  });

  describe('utility methods', () => {
    it('calls errorService methods correctly', () => {
      const mockStats = { total: 5, byType: { api: 3, network: 2 } };
      const mockErrors = [{ id: '1', message: 'Error 1' }];
      const mockExport = { errors: [], stats: {} };

      errorService.getErrorStats.mockReturnValue(mockStats);
      errorService.getRecentErrors.mockReturnValue(mockErrors);
      errorService.exportErrors.mockReturnValue(mockExport);

      const { result } = renderHook(() => useErrorHandler());

      expect(result.current.getErrorStats()).toBe(mockStats);
      expect(result.current.getRecentErrors(5)).toBe(mockErrors);
      expect(result.current.exportErrors()).toBe(mockExport);

      result.current.clearErrors();
      expect(errorService.clearErrors).toHaveBeenCalled();
    });
  });
});