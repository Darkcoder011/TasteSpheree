import { createContext, useCallback, useContext, useReducer, useRef } from 'react';

import { API_DEFAULTS, QLOO_CONFIG } from '@config/api';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

// API state management
const initialState = {
  isLoading: false,
  error: null,
  lastRequest: null,
  requestCount: 0,
  rateLimitInfo: {
    remaining: null,
    resetTime: null,
    limit: null
  },
  retryAttempts: 0,
  maxRetries: 3
};

// Action types for API state management
const API_ACTIONS = {
  REQUEST_START: 'REQUEST_START',
  REQUEST_SUCCESS: 'REQUEST_SUCCESS',
  REQUEST_ERROR: 'REQUEST_ERROR',
  SET_RATE_LIMIT: 'SET_RATE_LIMIT',
  RESET_ERROR: 'RESET_ERROR',
  INCREMENT_RETRY: 'INCREMENT_RETRY',
  RESET_RETRY: 'RESET_RETRY'
};

// API state reducer
const apiReducer = (state, action) => {
  switch (action.type) {
    case API_ACTIONS.REQUEST_START:
      return {
        ...state,
        isLoading: true,
        error: null,
        lastRequest: action.payload
      };
    
    case API_ACTIONS.REQUEST_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
        requestCount: state.requestCount + 1,
        retryAttempts: 0
      };
    
    case API_ACTIONS.REQUEST_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        retryAttempts: state.retryAttempts + 1
      };
    
    case API_ACTIONS.SET_RATE_LIMIT:
      return {
        ...state,
        rateLimitInfo: action.payload
      };
    
    case API_ACTIONS.RESET_ERROR:
      return {
        ...state,
        error: null
      };
    
    case API_ACTIONS.INCREMENT_RETRY:
      return {
        ...state,
        retryAttempts: state.retryAttempts + 1
      };
    
    case API_ACTIONS.RESET_RETRY:
      return {
        ...state,
        retryAttempts: 0
      };
    
    default:
      return state;
  }
};

export const ApiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(apiReducer, initialState);
  const requestCache = useRef(new Map());
  const pendingRequests = useRef(new Map());

  // Generate cache key for request deduplication
  const generateCacheKey = (url, options = {}) => {
    const key = `${url}_${JSON.stringify(options)}`;
    return key;
  };

  // Calculate exponential backoff delay
  const calculateBackoffDelay = (attempt) => {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  };

  // Parse rate limit headers
  const parseRateLimitHeaders = (headers) => {
    return {
      remaining: headers.get('X-RateLimit-Remaining') ? parseInt(headers.get('X-RateLimit-Remaining')) : null,
      limit: headers.get('X-RateLimit-Limit') ? parseInt(headers.get('X-RateLimit-Limit')) : null,
      resetTime: headers.get('X-RateLimit-Reset') ? new Date(parseInt(headers.get('X-RateLimit-Reset')) * 1000) : null
    };
  };

  // Check if we should retry based on error type
  const shouldRetry = (error, attempt) => {
    if (attempt >= state.maxRetries) return false;
    
    // Retry on network errors
    if (error.name === 'NetworkError' || error.message.includes('fetch')) return true;
    
    // Retry on 5xx server errors
    if (error.status >= 500 && error.status < 600) return true;
    
    // Retry on 429 (rate limit) with backoff
    if (error.status === 429) return true;
    
    // Don't retry on 4xx client errors (except 429)
    if (error.status >= 400 && error.status < 500) return false;
    
    return true;
  };

  // Enhanced fetch with retry logic and error handling
  const enhancedFetch = useCallback(async (url, options = {}) => {
    const cacheKey = generateCacheKey(url, options);
    
    // Check for pending identical request (deduplication)
    if (pendingRequests.current.has(cacheKey)) {
      return pendingRequests.current.get(cacheKey);
    }

    // Check cache for recent identical request
    const cachedResponse = requestCache.current.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < 60000) { // 1 minute cache
      return cachedResponse.data;
    }

    const requestPromise = async () => {
      dispatch({ type: API_ACTIONS.REQUEST_START, payload: { url, options } });

      let lastError;
      
      for (let attempt = 0; attempt <= state.maxRetries; attempt++) {
        try {
          // Add delay for retry attempts
          if (attempt > 0) {
            const delay = calculateBackoffDelay(attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          const response = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers
            }
          });

          // Parse rate limit headers
          const rateLimitInfo = parseRateLimitHeaders(response.headers);
          dispatch({ type: API_ACTIONS.SET_RATE_LIMIT, payload: rateLimitInfo });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            error.response = response;
            error.data = errorData;
            
            // Check if we should retry
            if (shouldRetry(error, attempt)) {
              lastError = error;
              continue;
            }
            
            throw error;
          }

          const data = await response.json();
          
          // Cache successful response
          requestCache.current.set(cacheKey, {
            data,
            timestamp: Date.now()
          });

          dispatch({ type: API_ACTIONS.REQUEST_SUCCESS });
          return data;

        } catch (error) {
          lastError = error;
          
          // If this is the last attempt or we shouldn't retry, throw the error
          if (attempt === state.maxRetries || !shouldRetry(error, attempt)) {
            break;
          }
        }
      }

      // If we get here, all retry attempts failed
      dispatch({ type: API_ACTIONS.REQUEST_ERROR, payload: lastError });
      throw lastError;
    };

    // Store the promise to prevent duplicate requests
    const promise = requestPromise();
    pendingRequests.current.set(cacheKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up pending request
      pendingRequests.current.delete(cacheKey);
    }
  }, [state.maxRetries]);

  // Qloo API specific request helper
  const qlooRequest = useCallback(async (endpoint, options = {}) => {
    const url = `${QLOO_CONFIG.baseUrl}${endpoint}`;
    
    return enhancedFetch(url, {
      ...options,
      headers: {
        ...QLOO_CONFIG.headers,
        ...options.headers
      }
    });
  }, [enhancedFetch]);

  // Gemini API request helper (mock for now)
  const geminiRequest = useCallback(async (prompt, options = {}) => {
    // This is a mock implementation - in real app would use actual Gemini API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          entities: [
            { name: 'Example Movie', type: 'movie', confidence: 0.9 },
            { name: 'Example Artist', type: 'artist', confidence: 0.8 }
          ],
          confidence: 0.85,
          processingTime: 1200
        });
      }, 1000 + Math.random() * 2000); // Simulate API delay
    });
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    dispatch({ type: API_ACTIONS.RESET_ERROR });
  }, []);

  // Clear request cache
  const clearCache = useCallback(() => {
    requestCache.current.clear();
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      size: requestCache.current.size,
      keys: Array.from(requestCache.current.keys())
    };
  }, []);

  // Check if rate limited
  const isRateLimited = useCallback(() => {
    const { remaining, resetTime } = state.rateLimitInfo;
    if (remaining === null) return false;
    if (remaining > 0) return false;
    if (resetTime && Date.now() > resetTime.getTime()) return false;
    return true;
  }, [state.rateLimitInfo]);

  // Get time until rate limit reset
  const getRateLimitResetTime = useCallback(() => {
    const { resetTime } = state.rateLimitInfo;
    if (!resetTime) return null;
    const timeUntilReset = resetTime.getTime() - Date.now();
    return timeUntilReset > 0 ? timeUntilReset : null;
  }, [state.rateLimitInfo]);

  const value = {
    // State
    ...state,
    
    // Request methods
    fetch: enhancedFetch,
    qlooRequest,
    geminiRequest,
    
    // Utility methods
    clearError,
    clearCache,
    getCacheStats,
    isRateLimited,
    getRateLimitResetTime,
    
    // Configuration
    config: {
      qloo: QLOO_CONFIG,
      defaults: API_DEFAULTS
    }
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

export default ApiContext;