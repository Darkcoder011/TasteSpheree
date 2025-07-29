/**
 * Error logging and reporting service
 */

class ErrorService {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
  }

  /**
   * Log an error with context information
   */
  logError(error, context = {}) {
    const errorEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId()
    };

    // Add to local error log
    this.errors.unshift(errorEntry);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorEntry);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('tastesphere-errors', JSON.stringify(this.errors.slice(0, 10)));
    } catch (e) {
      // Ignore localStorage errors
    }

    return errorEntry.id;
  }

  /**
   * Log a React error boundary error
   */
  logBoundaryError(error, errorInfo, componentName) {
    return this.logError(error, {
      type: 'boundary',
      componentName,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  /**
   * Log an API error
   */
  logApiError(error, endpoint, method = 'GET', requestData = null) {
    return this.logError(error, {
      type: 'api',
      endpoint,
      method,
      requestData,
      status: error.status || error.response?.status,
      statusText: error.statusText || error.response?.statusText
    });
  }

  /**
   * Log a network error
   */
  logNetworkError(error, context = {}) {
    return this.logError(error, {
      type: 'network',
      ...context,
      online: navigator.onLine,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  /**
   * Get errors by type
   */
  getErrorsByType(type) {
    return this.errors.filter(error => error.context.type === type);
  }

  /**
   * Clear error log
   */
  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('tastesphere-errors');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentErrors = this.errors.filter(error => 
      now - new Date(error.timestamp).getTime() < oneHour
    );

    const todayErrors = this.errors.filter(error => 
      now - new Date(error.timestamp).getTime() < oneDay
    );

    const errorsByType = this.errors.reduce((acc, error) => {
      const type = error.context.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.errors.length,
      lastHour: recentErrors.length,
      today: todayErrors.length,
      byType: errorsByType,
      mostRecent: this.errors[0]?.timestamp
    };
  }

  /**
   * Load errors from localStorage on initialization
   */
  loadStoredErrors() {
    try {
      const stored = localStorage.getItem('tastesphere-errors');
      if (stored) {
        const parsedErrors = JSON.parse(stored);
        this.errors = Array.isArray(parsedErrors) ? parsedErrors : [];
      }
    } catch (e) {
      // Ignore localStorage errors
      this.errors = [];
    }
  }

  /**
   * Get or generate a user ID for error tracking
   */
  getUserId() {
    try {
      let userId = localStorage.getItem('tastesphere-user-id');
      if (!userId) {
        userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem('tastesphere-user-id', userId);
      }
      return userId;
    } catch (e) {
      return 'anonymous';
    }
  }

  /**
   * Export errors for debugging
   */
  exportErrors() {
    return {
      errors: this.errors,
      stats: this.getErrorStats(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

// Create singleton instance
const errorService = new ErrorService();

// Load stored errors on initialization
errorService.loadStoredErrors();

// Global error handler
window.addEventListener('error', (event) => {
  errorService.logError(event.error || new Error(event.message), {
    type: 'global',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorService.logError(
    event.reason instanceof Error ? event.reason : new Error(event.reason),
    {
      type: 'unhandledPromise',
      promise: true
    }
  );
});

export default errorService;