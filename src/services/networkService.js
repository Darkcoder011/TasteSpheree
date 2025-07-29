/**
 * Network service for handling connectivity detection, retry logic, and offline mode
 */

class NetworkService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.retryAttempts = new Map(); // Track retry attempts per request
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second base delay
    this.maxDelay = 30000; // 30 seconds max delay
    this.listeners = new Set();
    
    this.setupEventListeners();
  }

  /**
   * Set up network event listeners
   */
  setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  /**
   * Add a network status listener
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of network status change
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  /**
   * Check if the device is online
   */
  getNetworkStatus() {
    return {
      isOnline: this.isOnline,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      } : null
    };
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateDelay(attempt) {
    const delay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, this.maxDelay);
  }

  /**
   * Create a retry key for tracking attempts
   */
  createRetryKey(url, method = 'GET') {
    return `${method}:${url}`;
  }

  /**
   * Get retry attempt count for a request
   */
  getRetryCount(url, method = 'GET') {
    const key = this.createRetryKey(url, method);
    return this.retryAttempts.get(key) || 0;
  }

  /**
   * Increment retry count for a request
   */
  incrementRetryCount(url, method = 'GET') {
    const key = this.createRetryKey(url, method);
    const count = this.getRetryCount(url, method) + 1;
    this.retryAttempts.set(key, count);
    return count;
  }

  /**
   * Reset retry count for a request
   */
  resetRetryCount(url, method = 'GET') {
    const key = this.createRetryKey(url, method);
    this.retryAttempts.delete(key);
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error) {
    // Network errors
    if (error.name === 'NetworkError' || error.name === 'TypeError') {
      return true;
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status) {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.status);
    }

    // Fetch API errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    return false;
  }

  /**
   * Determine if we should retry based on error and attempt count
   */
  shouldRetry(error, url, method = 'GET') {
    if (!this.isRetryableError(error)) {
      return false;
    }

    const retryCount = this.getRetryCount(url, method);
    
    // Don't retry if we've exceeded max attempts
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // Don't retry if offline (unless it's a connectivity test)
    if (!this.isOnline && !url.includes('connectivity-test')) {
      return false;
    }

    return true;
  }

  /**
   * Execute a request with automatic retry logic
   */
  async executeWithRetry(requestFn, url, method = 'GET', options = {}) {
    const {
      maxRetries = this.maxRetries,
      baseDelay = this.baseDelay,
      onRetry = null,
      onError = null
    } = options;

    let lastError;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Reset retry count on successful request
        if (attempt > 0) {
          this.resetRetryCount(url, method);
        }

        const result = await requestFn();
        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if we should retry
        if (attempt <= maxRetries && this.shouldRetry(error, url, method)) {
          this.incrementRetryCount(url, method);
          
          const delay = this.calculateDelay(attempt - 1);
          
          // Call retry callback if provided
          if (onRetry) {
            onRetry(error, attempt, delay);
          }

          // Wait before retrying
          await this.delay(delay);
          
          continue;
        }

        // No more retries, call error callback
        if (onError) {
          onError(error, attempt);
        }

        break;
      }
    }

    // Reset retry count after final failure
    this.resetRetryCount(url, method);
    throw lastError;
  }

  /**
   * Create a delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test network connectivity
   */
  async testConnectivity(timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  }

  /**
   * Enhanced fetch with retry logic
   */
  async fetch(url, options = {}) {
    const {
      timeout = 10000,
      retryOptions = {},
      ...fetchOptions
    } = options;

    const requestFn = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.statusText = response.statusText;
          error.response = response;
          throw error;
        }

        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timeout');
          timeoutError.name = 'TimeoutError';
          timeoutError.code = 'TIMEOUT';
          throw timeoutError;
        }
        
        throw error;
      }
    };

    return this.executeWithRetry(
      requestFn,
      url,
      fetchOptions.method || 'GET',
      retryOptions
    );
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (!this.isOnline) {
      return 'You appear to be offline. Please check your internet connection.';
    }

    if (error.name === 'TimeoutError') {
      return 'Request timed out. Please try again.';
    }

    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (error.status >= 500) {
      return 'The service is temporarily unavailable. Please try again later.';
    }

    if (error.status === 401 || error.status === 403) {
      return 'Authentication error. Please check your API configuration.';
    }

    if (error.name === 'NetworkError' || error.name === 'TypeError') {
      return 'Network error occurred. Please check your connection and try again.';
    }

    return error.message || 'An unexpected error occurred.';
  }

  /**
   * Clean up resources
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners.clear();
    this.retryAttempts.clear();
  }
}

// Create singleton instance
const networkService = new NetworkService();

export default networkService;