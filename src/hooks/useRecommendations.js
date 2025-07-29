import { useState, useEffect, useCallback, useRef } from 'react';
import { recommendationService } from '../services/recommendationService.js';

/**
 * Custom hook for managing recommendations with loading states, error handling, and caching
 * Provides a clean interface for components to fetch and display recommendations
 */
export const useRecommendations = (initialOptions = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Refs to track current request and prevent race conditions
  const currentRequestRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Default options
  const defaultOptions = {
    maxResults: 20,
    enableCache: true,
    deduplicateThreshold: 0.8,
    sortBy: 'score',
    sortOrder: 'desc',
    autoRetry: true,
    retryDelay: 2000,
    ...initialOptions
  };

  /**
   * Fetch recommendations for given entities
   * @param {Array<Object>} entities - Entities to get recommendations for
   * @param {Object} options - Fetching options
   * @returns {Promise<void>}
   */
  const fetchRecommendations = useCallback(async (entities, options = {}) => {
    // Validate input
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      setRecommendations([]);
      setError(null);
      setMetadata(null);
      return;
    }

    const requestOptions = { ...defaultOptions, ...options };
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    currentRequestRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const result = await recommendationService.fetchRecommendations(entities, requestOptions);

      // Check if this request is still current
      if (currentRequestRef.current !== requestId) {
        return; // Request was superseded
      }

      if (result.success) {
        setRecommendations(result.recommendations);
        setMetadata(result.metadata);
        setError(null);
        setLastFetchTime(new Date().toISOString());
      } else {
        setRecommendations([]);
        setError(result.error || 'Failed to fetch recommendations');
        setMetadata(result.metadata);
      }

    } catch (err) {
      // Check if this request is still current
      if (currentRequestRef.current !== requestId) {
        return; // Request was superseded
      }

      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }

      setRecommendations([]);
      setError(err.message || 'An unexpected error occurred');
      setMetadata(null);

      // Auto-retry if enabled
      if (requestOptions.autoRetry && !err.message.includes('VALIDATION_ERROR')) {
        setTimeout(() => {
          if (currentRequestRef.current === requestId) {
            fetchRecommendations(entities, { ...requestOptions, autoRetry: false });
          }
        }, requestOptions.retryDelay);
      }

    } finally {
      if (currentRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [defaultOptions]);

  /**
   * Refresh recommendations (bypass cache)
   * @param {Array<Object>} entities - Entities to refresh recommendations for
   * @param {Object} options - Refresh options
   * @returns {Promise<void>}
   */
  const refreshRecommendations = useCallback(async (entities, options = {}) => {
    const refreshOptions = {
      ...defaultOptions,
      ...options,
      enableCache: false // Force fresh fetch
    };

    await fetchRecommendations(entities, refreshOptions);
  }, [fetchRecommendations, defaultOptions]);

  /**
   * Filter recommendations by entity types
   * @param {Array<string>} allowedTypes - Allowed entity types
   * @returns {Array<Object>} - Filtered recommendations
   */
  const filterRecommendations = useCallback((allowedTypes = []) => {
    if (!allowedTypes.length) {
      return recommendations;
    }

    return recommendations.filter(rec =>
      allowedTypes.includes(rec.type.toLowerCase())
    );
  }, [recommendations]);

  /**
   * Get recommendations grouped by entity type
   * @returns {Object} - Recommendations grouped by type
   */
  const getRecommendationsByType = useCallback(() => {
    return recommendations.reduce((groups, rec) => {
      const type = rec.type.toLowerCase();
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(rec);
      return groups;
    }, {});
  }, [recommendations]);

  /**
   * Get available entity types from current recommendations
   * @returns {Array<string>} - Available entity types
   */
  const getAvailableTypes = useCallback(() => {
    const types = new Set(recommendations.map(rec => rec.type.toLowerCase()));
    return Array.from(types).sort();
  }, [recommendations]);

  /**
   * Retry last failed request
   * @returns {Promise<void>}
   */
  const retry = useCallback(async () => {
    if (!error) {
      return;
    }

    // This would need to store the last entities and options
    // For now, we'll just clear the error and let the parent component retry
    setError(null);
  }, [error]);

  /**
   * Clear all recommendations and state
   */
  const clearRecommendations = useCallback(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setRecommendations([]);
    setError(null);
    setMetadata(null);
    setIsLoading(false);
    setLastFetchTime(null);
    currentRequestRef.current = null;
  }, []);

  /**
   * Get service statistics
   * @returns {Object} - Service statistics
   */
  const getStats = useCallback(() => {
    return recommendationService.getStats();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    recommendations,
    isLoading,
    error,
    metadata,
    lastFetchTime,

    // Actions
    fetchRecommendations,
    refreshRecommendations,
    retry,
    clearRecommendations,

    // Utilities
    filterRecommendations,
    getRecommendationsByType,
    getAvailableTypes,
    getStats,

    // Computed values
    hasRecommendations: recommendations.length > 0,
    isEmpty: !isLoading && !error && recommendations.length === 0,
    isFromCache: metadata?.fromCache || false,
    totalFound: metadata?.totalFound || 0,
    processingTime: metadata?.processingTime || 0
  };
};

export default useRecommendations;