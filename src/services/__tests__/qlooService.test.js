import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  QlooService, 
  qlooService,
  buildInsightsUrl,
  parseQlooResponse,
  getCacheKey,
  isCacheValid,
  cleanExpiredCache,
  responseCache,
  pendingRequests
} from '../qlooService.js';
import { QLOO_CONFIG, QLOO_ENTITY_URNS, API_DEFAULTS, ENTITY_TYPES } from '../../config/api.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('QlooService', () => {
  let service;

  beforeEach(() => {
    service = new QlooService();
    service.reset();
    vi.clearAllMocks();
    responseCache.clear();
    pendingRequests.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct default values', () => {
      expect(service.baseUrl).toBe(QLOO_CONFIG.baseUrl);
      expect(service.apiKey).toBe(QLOO_CONFIG.apiKey);
      expect(service.headers).toEqual({
        ...QLOO_CONFIG.headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
      expect(service.requestCount).toBe(0);
      expect(service.maxRequestsPerMinute).toBe(100);
      expect(service.requestTimestamps).toEqual([]);
    });
  });

  describe('checkRateLimit', () => {
    it('should return true when under rate limit', () => {
      expect(service.checkRateLimit()).toBe(true);
    });

    it('should return false when rate limit exceeded', () => {
      // Fill up the rate limit
      const now = Date.now();
      for (let i = 0; i < 100; i++) {
        service.requestTimestamps.push(now - i * 100);
      }
      
      expect(service.checkRateLimit()).toBe(false);
    });

    it('should clean up old timestamps', () => {
      const now = Date.now();
      const twoMinutesAgo = now - 120000;
      
      service.requestTimestamps.push(twoMinutesAgo);
      service.requestTimestamps.push(now);
      
      service.checkRateLimit();
      
      expect(service.requestTimestamps).toHaveLength(1);
      expect(service.requestTimestamps[0]).toBe(now);
    });
  });

  describe('makeRequest', () => {
    it('should make successful request', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Test' }] };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.makeRequest('https://test.com');
      
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('https://test.com', {
        headers: service.headers
      });
    });

    it('should handle 429 rate limit error with retry', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: () => Promise.resolve('Rate limited')
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        });

      const result = await service.makeRequest('https://test.com');
      
      expect(result).toEqual({ data: [] });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries for 429', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited')
      });

      await expect(service.makeRequest('https://test.com')).rejects.toThrow('RATE_LIMIT');
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle 401 authentication error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      });

      await expect(service.makeRequest('https://test.com')).rejects.toThrow('AUTH_ERROR');
    });

    it('should handle 500 server error with retry', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server error')
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        });

      const result = await service.makeRequest('https://test.com');
      
      expect(result).toEqual({ data: [] });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle network error with retry', async () => {
      fetch
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        });

      const result = await service.makeRequest('https://test.com');
      
      expect(result).toEqual({ data: [] });
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw network error after max retries', async () => {
      fetch.mockRejectedValue(new TypeError('fetch failed'));

      await expect(service.makeRequest('https://test.com')).rejects.toThrow('NETWORK_ERROR');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('getRecommendations', () => {
    const mockEntities = [
      { name: 'Inception', type: 'movie' },
      { name: 'The Beatles', type: 'artist' }
    ];

    it('should get recommendations for valid entities', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Interstellar', score: 0.9 },
          { id: '2', name: 'The Dark Knight', score: 0.8 }
        ]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getRecommendations(mockEntities);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('score');
    });

    it('should handle empty entities array', async () => {
      const result = await service.getRecommendations([]);
      
      expect(result).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle null entities', async () => {
      await expect(service.getRecommendations(null)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should handle non-array entities', async () => {
      await expect(service.getRecommendations('not an array')).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should skip invalid entities', async () => {
      const entitiesWithInvalid = [
        { name: 'Inception', type: 'movie' },
        { name: '', type: 'movie' }, // Invalid - empty name
        { type: 'movie' }, // Invalid - no name
        { name: 'Test' }, // Invalid - no type
        { name: 'The Beatles', type: 'artist' }
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const result = await service.getRecommendations(entitiesWithInvalid);
      
      expect(result).toBeInstanceOf(Array);
      // Should only make requests for valid entities (movie and artist)
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should skip unsupported entity types', async () => {
      const entitiesWithUnsupported = [
        { name: 'Inception', type: 'movie' },
        { name: 'Something', type: 'unsupported_type' }
      ];

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.getRecommendations(entitiesWithUnsupported);
      
      expect(result).toBeInstanceOf(Array);
      expect(fetch).toHaveBeenCalledTimes(1); // Only for movie
      expect(consoleSpy).toHaveBeenCalledWith('Skipping unsupported entity type: unsupported_type');
      
      consoleSpy.mockRestore();
    });

    it('should use cache for repeated requests', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Test', score: 0.9 }] };
      
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // First request
      const result1 = await service.getRecommendations(mockEntities);
      
      // Second request (should use cache)
      const result2 = await service.getRecommendations(mockEntities);
      
      expect(result1).toEqual(result2);
      expect(fetch).toHaveBeenCalledTimes(2); // Once for each entity type
    });

    it('should enforce rate limiting', async () => {
      // Fill up rate limit
      for (let i = 0; i < 100; i++) {
        service.requestTimestamps.push(Date.now());
      }
      
      await expect(service.getRecommendations(mockEntities)).rejects.toThrow('RATE_LIMIT');
    });

    it('should sort results by score', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Low Score', score: 0.3 },
          { id: '2', name: 'High Score', score: 0.9 },
          { id: '3', name: 'Medium Score', score: 0.6 }
        ]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.getRecommendations([mockEntities[0]]);
      
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
      expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request')
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.getRecommendations(mockEntities);
      
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('fetchRecommendationsForType', () => {
    it('should fetch and parse recommendations correctly', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Test Movie', score: 0.9, description: 'A test movie' }
        ]
      };

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.fetchRecommendationsForType(
        'movie', 
        ['Inception'], 
        10, 
        'test_key'
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Test Movie',
        type: 'movie',
        score: 0.9
      });
    });

    it('should update request statistics', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      });

      const initialCount = service.requestCount;
      const initialTimestamps = service.requestTimestamps.length;

      await service.fetchRecommendationsForType(
        'movie', 
        ['Inception'], 
        10, 
        'test_key'
      );

      expect(service.requestCount).toBe(initialCount + 1);
      expect(service.requestTimestamps.length).toBe(initialTimestamps + 1);
    });

    it('should cache successful responses', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Test' }] };
      
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const cacheKey = 'test_cache_key';
      
      await service.fetchRecommendationsForType(
        'movie', 
        ['Inception'], 
        10, 
        cacheKey
      );

      expect(responseCache.has(cacheKey)).toBe(true);
      expect(responseCache.get(cacheKey).data).toHaveLength(1);
    });
  });

  describe('getStatus', () => {
    it('should return correct status information', () => {
      service.requestCount = 5;
      service.requestTimestamps = [Date.now()];
      responseCache.set('test', { data: [], timestamp: Date.now() });

      const status = service.getStatus();

      expect(status.baseUrl).toBe(QLOO_CONFIG.baseUrl);
      expect(status.requestCount).toBe(5);
      expect(status.rateLimitRemaining).toBe(99);
      expect(status.cacheSize).toBe(1);
      expect(status.pendingRequests).toBe(0);
      expect(status.lastRequestTime).toBeDefined();
    });

    it('should handle no previous requests', () => {
      const status = service.getStatus();

      expect(status.lastRequestTime).toBeNull();
      expect(status.rateLimitRemaining).toBe(100);
    });
  });

  describe('reset', () => {
    it('should reset service state', () => {
      service.requestCount = 10;
      service.requestTimestamps = [Date.now(), Date.now()];
      responseCache.set('test', { data: [] });
      pendingRequests.set('test', Promise.resolve());

      service.reset();

      expect(service.requestCount).toBe(0);
      expect(service.requestTimestamps).toEqual([]);
      expect(responseCache.size).toBe(0);
      expect(pendingRequests.size).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should clear only the response cache', () => {
      service.requestCount = 5;
      responseCache.set('test', { data: [] });

      service.clearCache();

      expect(service.requestCount).toBe(5); // Should not reset
      expect(responseCache.size).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('buildInsightsUrl', () => {
    it('should build correct URL with default parameters', () => {
      const url = buildInsightsUrl('movie');
      
      expect(url).toContain(QLOO_CONFIG.baseUrl);
      expect(url).toContain(QLOO_CONFIG.endpoints.insights);
      expect(url).toContain('entity_type=urn%3Aentity%3Amovie');
      expect(url).toContain('take=10');
    });

    it('should build URL with custom signal entities', () => {
      const signalEntities = ['entity1', 'entity2'];
      const url = buildInsightsUrl('movie', signalEntities);
      
      expect(url).toContain('signal_entities=entity1%2Centity2');
    });

    it('should build URL with custom take parameter', () => {
      const url = buildInsightsUrl('movie', [], 25);
      
      expect(url).toContain('take=25');
    });

    it('should enforce maximum take limit', () => {
      const url = buildInsightsUrl('movie', [], 100);
      
      expect(url).toContain('take=50'); // Should be capped at maxTake
    });

    it('should enforce minimum take limit', () => {
      const url = buildInsightsUrl('movie', [], 0);
      
      expect(url).toContain('take=1'); // Should be at least 1
    });

    it('should handle invalid take parameter', () => {
      const url = buildInsightsUrl('movie', [], 'invalid');
      
      expect(url).toContain('take=10'); // Should default to API_DEFAULTS.take
    });

    it('should throw error for missing entity type', () => {
      expect(() => buildInsightsUrl()).toThrow('Entity type is required');
    });

    it('should throw error for unsupported entity type', () => {
      expect(() => buildInsightsUrl('unsupported')).toThrow('Unsupported entity type');
    });

    it('should handle case insensitive entity types', () => {
      const url = buildInsightsUrl('movie'); // lowercase
      
      expect(url).toContain('entity_type=urn%3Aentity%3Amovie');
    });
  });

  describe('parseQlooResponse', () => {
    it('should parse valid response correctly', () => {
      const response = {
        data: [
          {
            id: '1',
            name: 'Test Movie',
            score: 0.9,
            description: 'A test movie',
            category: 'action',
            rating: 8.5
          }
        ]
      };

      const result = parseQlooResponse(response, 'movie');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Test Movie',
        type: 'movie',
        score: 0.9,
        source: 'qloo'
      });
      expect(result[0].metadata).toMatchObject({
        description: 'A test movie',
        category: 'action',
        rating: 8.5
      });
    });

    it('should handle response with missing fields', () => {
      const response = {
        data: [
          { id: '1' }, // Missing name and score
          { name: 'Test' } // Missing id and score
        ]
      };

      const result = parseQlooResponse(response, 'movie');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Unknown');
      expect(result[0].score).toBeGreaterThan(0);
      expect(result[1].id).toBe('movie_1');
    });

    it('should handle empty response', () => {
      const response = { data: [] };
      
      const result = parseQlooResponse(response, 'movie');
      
      expect(result).toEqual([]);
    });

    it('should handle null response', () => {
      const result = parseQlooResponse(null, 'movie');
      
      expect(result).toEqual([]);
    });

    it('should handle response without data field', () => {
      const response = { results: [] };
      
      const result = parseQlooResponse(response, 'movie');
      
      expect(result).toEqual([]);
    });

    it('should handle non-array data', () => {
      const response = { data: { id: '1', name: 'Test' } };
      
      const result = parseQlooResponse(response, 'movie');
      
      expect(result).toEqual([]);
    });

    it('should include timestamp in results', () => {
      const response = { data: [{ id: '1', name: 'Test' }] };
      
      const result = parseQlooResponse(response, 'movie');
      
      expect(result[0].timestamp).toBeDefined();
      expect(new Date(result[0].timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache key', () => {
      const key1 = getCacheKey('movie', ['entity1', 'entity2'], 10);
      const key2 = getCacheKey('movie', ['entity1', 'entity2'], 10);
      
      expect(key1).toBe(key2);
    });

    it('should sort signal entities for consistency', () => {
      const key1 = getCacheKey('movie', ['entity2', 'entity1'], 10);
      const key2 = getCacheKey('movie', ['entity1', 'entity2'], 10);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const key1 = getCacheKey('movie', ['entity1'], 10);
      const key2 = getCacheKey('movie', ['entity1'], 20);
      const key3 = getCacheKey('artist', ['entity1'], 10);
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('isCacheValid', () => {
    it('should return true for valid cache item', () => {
      const cacheItem = {
        data: [],
        timestamp: Date.now() - 1000 // 1 second ago
      };
      
      expect(isCacheValid(cacheItem)).toBe(true);
    });

    it('should return false for expired cache item', () => {
      const cacheItem = {
        data: [],
        timestamp: Date.now() - 6 * 60 * 1000 // 6 minutes ago
      };
      
      expect(isCacheValid(cacheItem)).toBe(false);
    });

    it('should return false for null cache item', () => {
      expect(isCacheValid(null)).toBe(false);
    });

    it('should return false for undefined cache item', () => {
      expect(isCacheValid(undefined)).toBe(false);
    });
  });

  describe('cleanExpiredCache', () => {
    beforeEach(() => {
      responseCache.clear();
    });

    it('should remove expired cache entries', () => {
      const now = Date.now();
      const expired = now - 6 * 60 * 1000; // 6 minutes ago
      const valid = now - 1000; // 1 second ago

      responseCache.set('expired', { data: [], timestamp: expired });
      responseCache.set('valid', { data: [], timestamp: valid });

      expect(responseCache.size).toBe(2);

      cleanExpiredCache();

      expect(responseCache.size).toBe(1);
      expect(responseCache.has('valid')).toBe(true);
      expect(responseCache.has('expired')).toBe(false);
    });

    it('should handle empty cache', () => {
      expect(() => cleanExpiredCache()).not.toThrow();
      expect(responseCache.size).toBe(0);
    });
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(qlooService).toBeInstanceOf(QlooService);
    expect(qlooService.baseUrl).toBe(QLOO_CONFIG.baseUrl);
  });

  it('should maintain state across imports', async () => {
    qlooService.requestCount = 5;
    
    expect(qlooService.requestCount).toBe(5);
  });
});