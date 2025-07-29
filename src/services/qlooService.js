import { QLOO_CONFIG, QLOO_ENTITY_URNS, API_DEFAULTS, DEFAULT_SIGNAL_ENTITY, ENTITY_TYPES } from '../config/api.js';
import networkService from './networkService.js';
import errorService from './errorService.js';

/**
 * Qloo API service for fetching personalized recommendations
 * Integrates with hackathon.api.qloo.com/v2/insights endpoint
 */

// Cache for API responses to avoid duplicate requests
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Request deduplication to prevent multiple identical requests
const pendingRequests = new Map();

/**
 * Parse Qloo API response and transform to our format
 * @param {Object} response - Raw API response
 * @param {string} entityType - Entity type for context
 * @returns {Array<Object>} - Parsed recommendations
 */
export const parseQlooResponse = (response, entityType) => {
  try {
    // Check if response has the expected structure
    if (!response || !response.results || !response.results.entities || !Array.isArray(response.results.entities)) {
      console.warn('Invalid Qloo API response structure:', response);
      return [];
    }

    // Transform entities to our recommendation format
    return response.results.entities.map(entity => ({
      id: entity.entity_id || entity.id || Math.random().toString(36).substr(2, 9),
      name: entity.name || 'Unknown',
      type: entityType,
      score: entity.popularity || entity.query?.affinity || 0.5,
      metadata: {
        description: entity.properties?.description || entity.properties?.short_description || '',
        image: entity.properties?.image?.url || null,
        year: entity.properties?.release_year || entity.properties?.publication_year || null,
        genre: entity.properties?.genre || [],
        rating: entity.properties?.content_rating || null,
        duration: entity.properties?.duration || null,
        // Additional metadata based on entity type
        ...(entityType === 'book' && {
          author: entity.properties?.author || null,
          isbn: entity.properties?.isbn13 || entity.properties?.isbn10 || null,
          pages: entity.properties?.page_count || null,
          publisher: entity.properties?.publisher || null
        }),
        ...(entityType === 'movie' && {
          director: entity.properties?.director || null,
          cast: entity.properties?.cast || [],
          releaseDate: entity.properties?.release_date || null
        }),
        ...(entityType === 'artist' && {
          genres: entity.tags?.filter(tag => tag.type === 'urn:tag:genre:music').map(tag => tag.name) || []
        })
      },
      // Keep original entity data for debugging
      _original: entity
    }));
  } catch (error) {
    console.error('Error parsing Qloo response:', error);
    return [];
  }
};

/**
 * Build insights URL for Qloo API
 * @param {string} entityType - The type of entity to get recommendations for
 * @param {Array<string>} signalEntities - Array of signal entity IDs
 * @param {number} take - Number of results to fetch (default: 10, max: 50)
 * @returns {string} - Complete URL for Qloo insights API
 */
export const buildInsightsUrl = (entityType, signalEntities = [], take = API_DEFAULTS.take) => {
  if (!entityType) {
    throw new Error('Entity type is required');
  }

  // Validate entity type is supported
  const normalizedType = entityType.toLowerCase();
  const urn = QLOO_ENTITY_URNS[normalizedType];
  if (!urn) {
    throw new Error(`Unsupported entity type: ${entityType}. Supported types: ${Object.values(ENTITY_TYPES).join(', ')}`);
  }

  // Validate take parameter
  const validTake = Math.min(Math.max(1, parseInt(take) || API_DEFAULTS.take), API_DEFAULTS.maxTake);

  // Always use the default signal entity as per API documentation
  // The API requires valid entity IDs, not entity names
  const entities = [DEFAULT_SIGNAL_ENTITY];

  // Build URL with query parameters
  const url = new URL(`${QLOO_CONFIG.baseUrl}${QLOO_CONFIG.endpoints.insights}`);
  url.searchParams.set('filter.type', urn);
  url.searchParams.set('signal.interests.entities', entities.join(','));
  url.searchParams.set('take', validTake.toString());

  return url.toString();
};


/**
 * Generate cache key for request
 * @param {string} entityType - Entity type
 * @param {Array<string>} signalEntities - Signal entities
 * @param {number} take - Number of results
 * @returns {string} - Cache key
 */
const getCacheKey = (entityType, signalEntities, take) => {
  return `${entityType}_${signalEntities.sort().join(',')}_${take}`;
};

/**
 * Check if cached response is still valid
 * @param {Object} cachedItem - Cached response item
 * @returns {boolean} - Whether cache is valid
 */
const isCacheValid = (cachedItem) => {
  if (!cachedItem) {
    return false;
  }
  return (Date.now() - cachedItem.timestamp) < CACHE_TTL;
};

/**
 * Clean expired cache entries
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, item] of responseCache.entries()) {
    if (now - item.timestamp >= CACHE_TTL) {
      responseCache.delete(key);
    }
  }
};

/**
 * Qloo API service class
 */
export class QlooService {
  constructor() {
    this.baseUrl = QLOO_CONFIG.baseUrl;
    this.apiKey = QLOO_CONFIG.apiKey;
    this.headers = {
      ...QLOO_CONFIG.headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    this.requestCount = 0;
    this.maxRequestsPerMinute = 100; // Conservative rate limit
    this.requestTimestamps = [];
  }

  /**
   * Check if service is within rate limits
   */
  checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );

    return this.requestTimestamps.length < this.maxRequestsPerMinute;
  }

  /**
   * Make HTTP request with error handling and retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - Response data
   */
  async makeRequest(url, options = {}) {
    const requestFn = async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Request failed (${response.status}): ${errorText}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.response = response;

        if (response.status === 429) {
          error.message = `RATE_LIMIT: Rate limit exceeded. Please try again later.`;
        } else if (response.status === 401 || response.status === 403) {
          error.message = `AUTH_ERROR: Authentication failed. Check API key.`;
        } else if (response.status >= 500) {
          error.message = `SERVER_ERROR: Server error (${response.status}): ${errorText}`;
        } else {
          error.message = `API_ERROR: Request failed (${response.status}): ${errorText}`;
        }

        throw error;
      }

      return await response.json();
    };

    try {
      return await networkService.executeWithRetry(
        requestFn,
        url,
        options.method || 'GET',
        {
          maxRetries: 3,
          onRetry: (error, attempt, delay) => {
            errorService.logApiError(error, url, options.method || 'GET', options.body);
            console.log(`Retrying Qloo API call (attempt ${attempt}) after ${delay}ms delay`);
          },
          onError: (error, attempts) => {
            errorService.logApiError(error, url, options.method || 'GET', {
              body: options.body,
              totalAttempts: attempts
            });
          }
        }
      );
    } catch (error) {
      // Enhanced error handling with user-friendly messages
      const userMessage = networkService.getErrorMessage(error);

      if (error.message.includes('RATE_LIMIT')) {
        throw new Error(`RATE_LIMIT: ${userMessage}`);
      } else if (error.message.includes('AUTH_ERROR')) {
        throw new Error(`AUTH_ERROR: ${userMessage}`);
      } else if (error.message.includes('SERVER_ERROR')) {
        throw new Error(`SERVER_ERROR: ${userMessage}`);
      } else if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
        throw new Error(`NETWORK_ERROR: ${userMessage}`);
      } else {
        throw new Error(`API_ERROR: ${userMessage}`);
      }
    }
  }

  /**
   * Get recommendations from Qloo API
   * @param {Array<Object>} entities - Array of entity objects with name and type
   * @param {number} take - Number of results to fetch per entity type
   * @returns {Promise<Array<Object>>} - Array of recommendation objects
   */
  async getRecommendations(entities, take = API_DEFAULTS.take) {
    try {
      // Validate input
      if (!entities || !Array.isArray(entities)) {
        throw new Error('VALIDATION_ERROR: Entities must be an array');
      }

      if (entities.length === 0) {
        return [];
      }

      // Check rate limiting
      if (!this.checkRateLimit()) {
        throw new Error('RATE_LIMIT: Rate limit exceeded. Please try again in a moment.');
      }

      // Group entities by type
      const entitiesByType = entities.reduce((acc, entity) => {
        if (!entity.type || !entity.name) {
          return acc; // Skip invalid entities
        }

        const type = entity.type.toLowerCase();
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(entity);
        return acc;
      }, {});

      // Clean expired cache entries
      cleanExpiredCache();

      const allRecommendations = [];
      const requestPromises = [];

      // Process each entity type
      for (const [entityType, typeEntities] of Object.entries(entitiesByType)) {
        // Check if entity type is supported
        const normalizedType = entityType.toLowerCase();
        if (!QLOO_ENTITY_URNS[normalizedType]) {
          console.warn(`Skipping unsupported entity type: ${entityType}`);
          continue;
        }

        // Use entity names as signal entities (in real implementation, these would be entity IDs)
        const signalEntities = typeEntities.map(e => e.name).slice(0, 5); // Limit to 5 signals
        const cacheKey = getCacheKey(entityType, signalEntities, take);

        // Check cache first
        const cachedResponse = responseCache.get(cacheKey);
        if (isCacheValid(cachedResponse)) {
          allRecommendations.push(...cachedResponse.data);
          continue;
        }

        // Check for pending request
        if (pendingRequests.has(cacheKey)) {
          requestPromises.push(pendingRequests.get(cacheKey));
          continue;
        }

        // Create new request
        const requestPromise = this.fetchRecommendationsForType(entityType, signalEntities, take, cacheKey);
        pendingRequests.set(cacheKey, requestPromise);
        requestPromises.push(requestPromise);
      }

      // Wait for all requests to complete
      const results = await Promise.allSettled(requestPromises);

      // Process results
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allRecommendations.push(...result.value);
        } else if (result.status === 'rejected') {
          console.error('Recommendation request failed:', result.reason);
        }
      });

      // Sort by score and return
      return allRecommendations.sort((a, b) => (b.score || 0) - (a.score || 0));

    } catch (error) {
      // Enhanced error handling
      if (error.message.includes('RATE_LIMIT')) {
        throw error;
      } else if (error.message.includes('VALIDATION_ERROR')) {
        throw error;
      } else if (error.message.includes('NETWORK_ERROR')) {
        throw error;
      } else {
        throw new Error(`PROCESSING_ERROR: ${error.message}`);
      }
    }
  }

  /**
   * Fetch recommendations for a specific entity type
   * @param {string} entityType - Entity type
   * @param {Array<string>} signalEntities - Signal entities
   * @param {number} take - Number of results
   * @param {string} cacheKey - Cache key
   * @returns {Promise<Array<Object>>} - Recommendations
   */
  async fetchRecommendationsForType(entityType, signalEntities, take, cacheKey) {
    try {
      // Record request timestamp
      this.requestTimestamps.push(Date.now());
      this.requestCount++;

      // Build URL
      const url = buildInsightsUrl(entityType, signalEntities, take);

      // Make request
      const response = await this.makeRequest(url);

      // Parse response
      const recommendations = parseQlooResponse(response, entityType);

      // Cache response
      responseCache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now()
      });

      // Clean up pending request
      pendingRequests.delete(cacheKey);

      return recommendations;

    } catch (error) {
      // Clean up pending request on error
      pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Get service status and statistics
   * @returns {Object} - Service status information
   */
  getStatus() {
    return {
      baseUrl: this.baseUrl,
      requestCount: this.requestCount,
      rateLimitRemaining: this.maxRequestsPerMinute - this.requestTimestamps.length,
      cacheSize: responseCache.size,
      pendingRequests: pendingRequests.size,
      lastRequestTime: this.requestTimestamps.length > 0
        ? new Date(this.requestTimestamps[this.requestTimestamps.length - 1]).toISOString()
        : null
    };
  }

  /**
   * Clear cache and reset service state
   */
  reset() {
    this.requestCount = 0;
    this.requestTimestamps = [];
    responseCache.clear();
    pendingRequests.clear();
  }

  /**
   * Clear only the response cache
   */
  clearCache() {
    responseCache.clear();
  }
}

// Export singleton instance
export const qlooService = new QlooService();

// Export utility functions for testing
export {
  getCacheKey,
  isCacheValid,
  cleanExpiredCache,
  responseCache,
  pendingRequests
};