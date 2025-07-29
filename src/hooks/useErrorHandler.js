import { useCallback, useContext } from 'react';
import errorService from '../services/errorService';

/**
 * Hook for handling errors consistently across the application
 */
export const useErrorHandler = () => {
  const handleError = useCallback((error, context = {}) => {
    // Log the error
    const errorId = errorService.logError(error, context);
    
    // Return error info for component use
    return {
      errorId,
      message: error.message || 'An unexpected error occurred',
      canRetry: context.canRetry !== false,
      timestamp: new Date().toISOString()
    };
  }, []);

  const handleApiError = useCallback((error, endpoint, method = 'GET', requestData = null) => {
    const errorId = errorService.logApiError(error, endpoint, method, requestData);
    
    // Determine user-friendly message based on error type
    let userMessage = 'An error occurred while connecting to the service.';
    
    if (error.name === 'NetworkError' || !navigator.onLine) {
      userMessage = 'Please check your internet connection and try again.';
    } else if (error.status === 429) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.status >= 500) {
      userMessage = 'The service is temporarily unavailable. Please try again later.';
    } else if (error.status === 401 || error.status === 403) {
      userMessage = 'Authentication error. Please check your API configuration.';
    }

    return {
      errorId,
      message: userMessage,
      originalError: error,
      canRetry: error.status !== 401 && error.status !== 403,
      retryAfter: error.status === 429 ? 60000 : 5000, // 1 minute for rate limit, 5 seconds for others
      timestamp: new Date().toISOString()
    };
  }, []);

  const handleNetworkError = useCallback((error, context = {}) => {
    const errorId = errorService.logNetworkError(error, context);
    
    let userMessage = 'Network error occurred.';
    
    if (!navigator.onLine) {
      userMessage = 'You appear to be offline. Please check your internet connection.';
    } else if (error.name === 'TimeoutError') {
      userMessage = 'Request timed out. Please try again.';
    }

    return {
      errorId,
      message: userMessage,
      originalError: error,
      canRetry: true,
      retryAfter: 3000,
      timestamp: new Date().toISOString()
    };
  }, []);

  const handleBoundaryError = useCallback((error, errorInfo, componentName) => {
    const errorId = errorService.logBoundaryError(error, errorInfo, componentName);
    
    return {
      errorId,
      message: `An error occurred in the ${componentName} component.`,
      originalError: error,
      canRetry: true,
      timestamp: new Date().toISOString()
    };
  }, []);

  const getErrorStats = useCallback(() => {
    return errorService.getErrorStats();
  }, []);

  const getRecentErrors = useCallback((limit = 10) => {
    return errorService.getRecentErrors(limit);
  }, []);

  const clearErrors = useCallback(() => {
    errorService.clearErrors();
  }, []);

  const exportErrors = useCallback(() => {
    return errorService.exportErrors();
  }, []);

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleBoundaryError,
    getErrorStats,
    getRecentErrors,
    clearErrors,
    exportErrors
  };
};

export default useErrorHandler;