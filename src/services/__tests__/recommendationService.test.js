import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RecommendationService } from '../recommendationService.js';
import { qlooService } from '../qlooService.js';

// Mock the qlooService
vi.mock('../qlooService.js', () => ({
  qlooService: {
    getRecommendations: vi.fn(),
    getStatus: vi.fn(() => ({ requestCount: 0 })),
    clearCache: vi.fn(),
    reset: vi.fn()
  }
}));

// Mock dataUtils
vi.mock('../dataUtils.js', () => ({
  deduplicateRecommendations: vi.fn((recs) => recs),
  sortRecommendations: vi.fn((recs) => recs),
  mergeRecommendations: vi.fn((recs) => recs.flat())
}));

describe('RecommendationService', () => {
  let service;
  let mockEntities;
  let mockRecommendations;

  beforeEach(() => {
    service = new RecommendationService();
    
    mockEntities = [
      { name: 'The Matrix', type: 'movie' },
      { name: 'Inception', type: 'movie' }
    ];

    mockRecommendations = [
      {
        id: 'rec-1',
        name: 'Blade Runner',
        type: 'movie',
        score: 0.85,
        metadata: { year: 1982 }
      },
      {
        id: 'rec-2',
        name: 'Neuromancer',
        type: 'book',
        score: 0.78,
        metadata: { author: 'William Gibson' }
      }
    ];

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.reset();
  });

  describe('fetchRecommendations', () => {
    it('fetches recommendations successfully', async () => {
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      const result = await service.fetchRecommendations(mockEntities);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(2);
      expect(result.metadata.totalFound).toBe(2);
      expect(result.metadata.fromCache).toBe(false);
      expect(qlooService.getRecommendations).toHaveBeenCalledWith(mockEntities, 20);
    });

    it('handles empty entities array', async () => {
      const result = await service.fetchRecommendations([]);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(0);
      expect(result.metadata.reason).toBe('No entities provided');
      expect(qlooService.getRecommendations).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const errorMessage = 'API Error';
      qlooService.getRecommendations.mockRejectedValue(new Error(errorMessage));

      const result = await service.fetchRecommendations(mockEntities);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.recommendations).toHaveLength(0);
    });

    it('uses cache when available', async () => {
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      // First request
      const result1 = await service.fetchRecommendations(mockEntities);
      expect(result1.fromCache).toBe(false);

      // Second request should use cache
      const result2 = await service.fetchRecommendations(mockEntities);
      expect(result2.fromCache).toBe(true);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(1);
    });

    it('bypasses cache when disabled', async () => {
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      // First request
      await service.fetchRecommendations(mockEntities);

      // Second request with cache disabled
      const result = await service.fetchRecommendations(mockEntities, { enableCache: false });
      
      expect(result.fromCache).toBe(false);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(2);
    });

    it('respects maxResults option', async () => {
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      await service.fetchRecommendations(mockEntities, { maxResults: 10 });

      expect(qlooService.getRecommendations).toHaveBeenCalledWith(mockEntities, 10);
    });

    it('handles timeout correctly', async () => {
      // Mock a slow response
      qlooService.getRecommendations.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockRecommendations), 2000))
      );

      const result = await service.fetchRecommendations(mockEntities, { timeout: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
    });

    it('retries failed requests', async () => {
      qlooService.getRecommendations
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockRecommendations);

      const result = await service.fetchRecommendations(mockEntities);

      expect(result.success).toBe(true);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(2);
    });

    it('does not retry validation errors', async () => {
      qlooService.getRecommendations.mockRejectedValue(new Error('VALIDATION_ERROR: Invalid input'));

      const result = await service.fetchRecommendations(mockEntities);

      expect(result.success).toBe(false);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(1);
    });
  });

  describe('processRecommendations', () => {
    it('processes recommendations correctly', () => {
      const processed = service.processRecommendations(mockRecommendations);

      expect(processed).toHaveLength(2);
      expect(processed[0]).toHaveProperty('displayIndex', 1);
      expect(processed[0]).toHaveProperty('displayScore');
      expect(processed[0]).toHaveProperty('displayType');
    });

    it('handles empty recommendations', () => {
      const processed = service.processRecommendations([]);
      expect(processed).toHaveLength(0);
    });

    it('limits results to maxResults', () => {
      const manyRecs = Array.from({ length: 10 }, (_, i) => ({
        id: `rec-${i}`,
        name: `Item ${i}`,
        type: 'movie',
        score: 0.8
      }));

      const processed = service.processRecommendations(manyRecs, { maxResults: 5 });
      expect(processed).toHaveLength(5);
    });
  });

  describe('getRecommendationsByType', () => {
    it('filters recommendations by allowed types', async () => {
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      const result = await service.getRecommendationsByType(mockEntities, ['movie']);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].type).toBe('movie');
      expect(result.metadata.appliedFilters).toEqual(['movie']);
    });

    it('returns all recommendations when no types specified', async () => {
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      const result = await service.getRecommendationsByType(mockEntities, []);

      expect(result.success).toBe(true);
      expect(result.recommendations).toHaveLength(2);
    });
  });

  describe('refreshRecommendations', () => {
    it('bypasses cache and fetches fresh data', async () => {
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      // First request to populate cache
      await service.fetchRecommendations(mockEntities);

      // Refresh should bypass cache
      const result = await service.refreshRecommendations(mockEntities);

      expect(result.fromCache).toBe(false);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(2);
    });
  });

  describe('caching', () => {
    it('generates consistent cache keys', () => {
      const entities1 = [{ name: 'A', type: 'movie' }, { name: 'B', type: 'book' }];
      const entities2 = [{ name: 'B', type: 'book' }, { name: 'A', type: 'movie' }];

      const key1 = service.generateCacheKey(entities1, {});
      const key2 = service.generateCacheKey(entities2, {});

      expect(key1).toBe(key2); // Should be same due to sorting
    });

    it('respects cache timeout', async () => {
      // Set short cache timeout for testing
      service.cacheTimeout = 100;

      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      // First request
      await service.fetchRecommendations(mockEntities);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second request should not use expired cache
      const result = await service.fetchRecommendations(mockEntities);
      expect(result.fromCache).toBe(false);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(2);
    });

    it('implements LRU cache behavior', async () => {
      // Set small cache size for testing
      service.maxCacheSize = 2;

      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      const entities1 = [{ name: 'A', type: 'movie' }];
      const entities2 = [{ name: 'B', type: 'movie' }];
      const entities3 = [{ name: 'C', type: 'movie' }];

      // Fill cache
      await service.fetchRecommendations(entities1);
      await service.fetchRecommendations(entities2);

      // This should evict the first entry
      await service.fetchRecommendations(entities3);

      // First entry should no longer be cached
      const result = await service.fetchRecommendations(entities1);
      expect(result.fromCache).toBe(false);
    });
  });

  describe('error handling', () => {
    it('identifies non-retryable errors', () => {
      expect(service.shouldNotRetry(new Error('VALIDATION_ERROR: Bad input'))).toBe(true);
      expect(service.shouldNotRetry(new Error('AUTH_ERROR: Invalid key'))).toBe(true);
      expect(service.shouldNotRetry(new Error('Network error'))).toBe(false);
    });

    it('creates proper error results', () => {
      const errorResult = service.createErrorResult('Test error', mockEntities);

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Test error');
      expect(errorResult.recommendations).toHaveLength(0);
      expect(errorResult.metadata.entities).toBe(2);
    });

    it('creates proper empty results', () => {
      const emptyResult = service.createEmptyResult('No data');

      expect(emptyResult.success).toBe(true);
      expect(emptyResult.recommendations).toHaveLength(0);
      expect(emptyResult.metadata.reason).toBe('No data');
    });
  });

  describe('utility functions', () => {
    it('formats scores correctly', () => {
      expect(service.formatScore(0.85)).toBe('85%');
      expect(service.formatScore(0.123)).toBe('12%');
      expect(service.formatScore(null)).toBe('');
    });

    it('formats entity types correctly', () => {
      expect(service.formatEntityType('tv_show')).toBe('Tv Show');
      expect(service.formatEntityType('movie')).toBe('Movie');
      expect(service.formatEntityType('')).toBe('');
    });
  });

  describe('service management', () => {
    it('provides service statistics', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('maxCacheSize');
      expect(stats).toHaveProperty('pendingRequests');
      expect(stats).toHaveProperty('qlooStats');
    });

    it('clears cache correctly', () => {
      service.cache.set('test', { data: 'test' });
      service.clearCache();

      expect(service.cache.size).toBe(0);
      expect(qlooService.clearCache).toHaveBeenCalled();
    });

    it('resets service state', () => {
      service.cache.set('test', { data: 'test' });
      service.reset();

      expect(service.cache.size).toBe(0);
      expect(qlooService.reset).toHaveBeenCalled();
    });
  });

  describe('concurrent requests', () => {
    it('deduplicates identical concurrent requests', async () => {
      qlooService.getRecommendations.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockRecommendations), 100))
      );

      // Start two identical requests concurrently
      const [result1, result2] = await Promise.all([
        service.fetchRecommendations(mockEntities),
        service.fetchRecommendations(mockEntities)
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(1);
    });
  });
});