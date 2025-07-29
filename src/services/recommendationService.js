import { qlooService } from './qlooService.js';
import { deduplicateRecommendations, sortRecommendations, mergeRecommendations } from './dataUtils.js';

/**
 * Recommendation service for handling recommendation fetching, caching, and display logic
 * Integrates with Qloo API and provides optimized recommendation management
 */

export class RecommendationService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.maxCacheSize = 100;
    this.requestTimeout = 30000; // 30 seconds
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Fetch recommendations with caching and optimization
   * @param {Array<Object>} entities - Array of entity objects
   * @param {Object} options - Fetching options
   * @returns {Promise<Object>} - Recommendation result with metadata
   */
  async fetchRecommendations(entities, options = {}) {
    const {
      maxResults = 20,
      enableCache = true,
      deduplicateThreshold = 0.8,
      sortBy = 'score',
      sortOrder = 'desc',
      timeout = this.requestTimeout
    } = options;

    try {
      // Validate input
      if (!Array.isArray(entities) || entities.length === 0) {
        return this.createEmptyResult('No entities provided');
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(entities, options);

      // Check cache first
      if (enableCache) {
        const cachedResult = this.getCachedResult(cacheKey);
        if (cachedResult) {
          return {
            ...cachedResult,
            fromCache: true,
            timestamp: new Date().toISOString()
          };
        }
      }

      // Check for pending request
      if (this.pendingRequests.has(cacheKey)) {
        return await this.pendingRequests.get(cacheKey);
      }

      // Create new request with timeout
      const requestPromise = this.executeRecommendationRequest(entities, options, timeout);
      this.pendingRequests.set(cacheKey, requestPromise);

      try {
        const result = await requestPromise;

        // Cache successful result
        if (enableCache && result.success) {
          this.cacheResult(cacheKey, result);
        }

        return result;

      } finally {
        // Clean up pending request
        this.pendingRequests.delete(cacheKey);
      }

    } catch (error) {
      return this.createErrorResult(error.message, entities);
    }
  }

  /**
   * Execute the actual recommendation request with retry logic
   * @param {Array<Object>} entities - Entities to get recommendations for
   * @param {Object} options - Request options
   * @param {number} timeout - Request timeout
   * @returns {Promise<Object>} - Recommendation result
   */
  async executeRecommendationRequest(entities, options, timeout) {
    const {
      maxResults = 20,
      deduplicateThreshold = 0.8,
      sortBy = 'score',
      sortOrder = 'desc'
    } = options;

    let lastError;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        // Race between actual request and timeout
        const recommendationsPromise = qlooService.getRecommendations(entities, maxResults);
        const rawRecommendations = await Promise.race([recommendationsPromise, timeoutPromise]);

        // Process recommendations
        const processedRecommendations = this.processRecommendations(
          rawRecommendations,
          { deduplicateThreshold, sortBy, sortOrder, maxResults }
        );

        const processingTime = Date.now() - startTime;

        return {
          success: true,
          recommendations: processedRecommendations,
          metadata: {
            totalFound: rawRecommendations.length,
            totalReturned: processedRecommendations.length,
            processingTime,
            attempt,
            entities: entities.length,
            fromCache: false
          },
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        lastError = error;

        // Don't retry certain types of errors
        if (this.shouldNotRetry(error)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Process raw recommendations with deduplication, sorting, and filtering
   * @param {Array<Object>} recommendations - Raw recommendations
   * @param {Object} options - Processing options
   * @returns {Array<Object>} - Processed recommendations
   */
  processRecommendations(recommendations, options = {}) {
    const {
      deduplicateThreshold = 0.8,
      sortBy = 'score',
      sortOrder = 'desc',
      maxResults = 20
    } = options;

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      return [];
    }

    // Step 1: Deduplicate recommendations
    let processed = deduplicateRecommendations(recommendations, deduplicateThreshold);

    // Step 2: Sort recommendations
    processed = sortRecommendations(processed, {
      sortBy,
      order: sortOrder
    });

    // Step 3: Limit results
    processed = processed.slice(0, maxResults);

    // Step 4: Add display metadata
    processed = processed.map((rec, index) => ({
      ...rec,
      displayIndex: index + 1,
      displayScore: this.formatScore(rec.score),
      displayType: this.formatEntityType(rec.type)
    }));

    return processed;
  }

  /**
   * Get recommendations by entity type with filtering
   * @param {Array<Object>} entities - Entities to filter by
   * @param {Array<string>} allowedTypes - Allowed entity types
   * @param {Object} options - Fetching options
   * @returns {Promise<Object>} - Filtered recommendation result
   */
  async getRecommendationsByType(entities, allowedTypes = [], options = {}) {
    try {
      const result = await this.fetchRecommendations(entities, options);

      if (!result.success) {
        return result;
      }

      // Filter by allowed types if specified
      let filteredRecommendations = result.recommendations;
      if (allowedTypes.length > 0) {
        filteredRecommendations = result.recommendations.filter(rec =>
          allowedTypes.includes(rec.type.toLowerCase())
        );
      }

      return {
        ...result,
        recommendations: filteredRecommendations,
        metadata: {
          ...result.metadata,
          filteredCount: filteredRecommendations.length,
          appliedFilters: allowedTypes
        }
      };

    } catch (error) {
      return this.createErrorResult(error.message, entities);
    }
  }

  /**
   * Refresh recommendations (bypass cache)
   * @param {Array<Object>} entities - Entities to get recommendations for
   * @param {Object} options - Fetching options
   * @returns {Promise<Object>} - Fresh recommendation result
   */
  async refreshRecommendations(entities, options = {}) {
    // Clear cache for these entities
    const cacheKey = this.generateCacheKey(entities, options);
    this.cache.delete(cacheKey);

    // Fetch fresh recommendations
    return this.fetchRecommendations(entities, {
      ...options,
      enableCache: true // Re-enable cache for fresh result
    });
  }

  /**
   * Get cached recommendations if available
   * @param {string} cacheKey - Cache key
   * @returns {Object|null} - Cached result or null
   */
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * Cache recommendation result
   * @param {string} cacheKey - Cache key
   * @param {Object} result - Result to cache
   */
  cacheResult(cacheKey, result) {
    // Implement LRU cache behavior
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, {
      result: { ...result, fromCache: false },
      timestamp: Date.now()
    });
  }

  /**
   * Generate cache key for entities and options
   * @param {Array<Object>} entities - Entities
   * @param {Object} options - Options
   * @returns {string} - Cache key
   */
  generateCacheKey(entities, options) {
    const entityKey = entities
      .map(e => `${e.type}:${e.name}`)
      .sort()
      .join('|');

    const optionsKey = JSON.stringify({
      maxResults: options.maxResults || 20,
      sortBy: options.sortBy || 'score',
      sortOrder: options.sortOrder || 'desc'
    });

    return `${entityKey}::${optionsKey}`;
  }

  /**
   * Check if error should not be retried
   * @param {Error} error - Error to check
   * @returns {boolean} - Whether to skip retry
   */
  shouldNotRetry(error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('validation_error') ||
      message.includes('auth_error') ||
      message.includes('invalid api key') ||
      message.includes('forbidden')
    );
  }

  /**
   * Format score for display
   * @param {number} score - Raw score
   * @returns {string} - Formatted score
   */
  formatScore(score) {
    if (typeof score !== 'number') return '';
    return `${Math.round(score * 100)}%`;
  }

  /**
   * Format entity type for display
   * @param {string} type - Entity type
   * @returns {string} - Formatted type
   */
  formatEntityType(type) {
    if (!type) return '';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Create empty result object
   * @param {string} reason - Reason for empty result
   * @returns {Object} - Empty result
   */
  createEmptyResult(reason = 'No recommendations found') {
    return {
      success: true,
      recommendations: [],
      metadata: {
        totalFound: 0,
        totalReturned: 0,
        processingTime: 0,
        reason,
        fromCache: false
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error result object
   * @param {string} message - Error message
   * @param {Array<Object>} entities - Original entities
   * @returns {Object} - Error result
   */
  createErrorResult(message, entities = []) {
    return {
      success: false,
      recommendations: [],
      error: message,
      metadata: {
        totalFound: 0,
        totalReturned: 0,
        processingTime: 0,
        entities: entities.length,
        fromCache: false
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get service statistics
   * @returns {Object} - Service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      pendingRequests: this.pendingRequests.size,
      cacheHitRate: this.calculateCacheHitRate(),
      qlooStats: qlooService.getStatus()
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   * @returns {number} - Cache hit rate percentage
   */
  calculateCacheHitRate() {
    // This is a simplified implementation
    // In a real app, you'd track hits and misses
    return this.cache.size > 0 ? 75 : 0; // Mock value
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
    qlooService.clearCache();
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset service state
   */
  reset() {
    this.clearCache();
    qlooService.reset();
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();

export default recommendationService;