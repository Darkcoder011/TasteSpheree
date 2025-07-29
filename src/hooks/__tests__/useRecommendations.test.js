import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRecommendations } from '../useRecommendations.js';
import { recommendationService } from '../../services/recommendationService.js';

// Mock the recommendation service
vi.mock('../../services/recommendationService.js', () => ({
  recommendationService: {
    fetchRecommendations: vi.fn(),
    getStats: vi.fn(() => ({ cacheSize: 0 }))
  }
}));

describe('useRecommendations', () => {
  let mockEntities;
  let mockRecommendations;
  let mockSuccessResult;
  let mockErrorResult;

  beforeEach(() => {
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

    mockSuccessResult = {
      success: true,
      recommendations: mockRecommendations,
      metadata: {
        totalFound: 2,
        totalReturned: 2,
        processingTime: 150,
        fromCache: false
      }
    };

    mockErrorResult = {
      success: false,
      recommendations: [],
      error: 'API Error',
      metadata: {
        totalFound: 0,
        totalReturned: 0,
        processingTime: 0,
        fromCache: false
      }
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useRecommendations());

      expect(result.current.recommendations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.metadata).toBe(null);
      expect(result.current.hasRecommendations).toBe(false);
      expect(result.current.isEmpty).toBe(true);
    });

    it('accepts initial options', () => {
      const initialOptions = { maxResults: 10 };
      const { result } = renderHook(() => useRecommendations(initialOptions));

      // Options are internal, but we can test they're used in fetch calls
      expect(result.current.recommendations).toEqual([]);
    });
  });

  describe('fetchRecommendations', () => {
    it('fetches recommendations successfully', async () => {
      recommendationService.fetchRecommendations.mockResolvedValue(mockSuccessResult);

      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recommendations).toEqual(mockRecommendations);
      expect(result.current.error).toBe(null);
      expect(result.current.metadata).toEqual(mockSuccessResult.metadata);
      expect(result.current.hasRecommendations).toBe(true);
      expect(result.current.isEmpty).toBe(false);
    });

    it('handles API errors', async () => {
      recommendationService.fetchRecommendations.mockResolvedValue(mockErrorResult);

      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recommendations).toEqual([]);
      expect(result.current.error).toBe('API Error');
      expect(result.current.hasRecommendations).toBe(false);
      expect(result.current.isEmpty).toBe(false); // Not empty because there's an error
    });

    it('handles empty entities array', async () => {
      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.fetchRecommendations([]);
      });

      expect(result.current.recommendations).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(recommendationService.fetchRecommendations).not.toHaveBeenCalled();
    });

    it('handles null entities', async () => {
      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.fetchRecommendations(null);
      });

      expect(result.current.recommendations).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(recommendationService.fetchRecommendations).not.toHaveBeenCalled();
    });

    it('cancels previous requests when new one starts', async () => {
      let resolveFirst;
      let resolveSecond;

      const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
      const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

      recommendationService.fetchRecommendations
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useRecommendations());

      // Start first request
      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      // Start second request before first completes
      act(() => {
        result.current.fetchRecommendations([{ name: 'Different', type: 'movie' }]);
      });

      // Resolve first request (should be ignored)
      resolveFirst(mockSuccessResult);

      // Resolve second request
      resolveSecond({
        ...mockSuccessResult,
        recommendations: [{ id: 'different', name: 'Different Movie', type: 'movie' }]
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.recommendations[0].name).toBe('Different Movie');
    });

    it('passes options to service', async () => {
      recommendationService.fetchRecommendations.mockResolvedValue(mockSuccessResult);

      const { result } = renderHook(() => useRecommendations());
      const options = { maxResults: 10, sortBy: 'name' };

      act(() => {
        result.current.fetchRecommendations(mockEntities, options);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(recommendationService.fetchRecommendations).toHaveBeenCalledWith(
        mockEntities,
        expect.objectContaining(options)
      );
    });
  });

  describe('refreshRecommendations', () => {
    it('refreshes recommendations', async () => {
      recommendationService.fetchRecommendations.mockResolvedValue(mockSuccessResult);

      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.refreshRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(recommendationService.fetchRecommendations).toHaveBeenCalledWith(
        mockEntities,
        expect.objectContaining({ enableCache: false })
      );
    });
  });

  describe('filtering and utilities', () => {
    beforeEach(async () => {
      recommendationService.fetchRecommendations.mockResolvedValue(mockSuccessResult);

      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('filters recommendations by type', async () => {
      const { result } = renderHook(() => useRecommendations());

      // First fetch recommendations
      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const movieRecs = result.current.filterRecommendations(['movie']);
      expect(movieRecs).toHaveLength(1);
      expect(movieRecs[0].type).toBe('movie');

      const allRecs = result.current.filterRecommendations([]);
      expect(allRecs).toHaveLength(2);
    });

    it('groups recommendations by type', async () => {
      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const grouped = result.current.getRecommendationsByType();
      expect(grouped).toHaveProperty('movie');
      expect(grouped).toHaveProperty('book');
      expect(grouped.movie).toHaveLength(1);
      expect(grouped.book).toHaveLength(1);
    });

    it('gets available types', async () => {
      const { result } = renderHook(() => useRecommendations());

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const types = result.current.getAvailableTypes();
      expect(types).toEqual(['book', 'movie']); // Sorted
    });
  });

  describe('error handling and retry', () => {
    it('implements auto-retry on failure', async () => {
      vi.useFakeTimers();

      recommendationService.fetchRecommendations
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockSuccessResult);

      const { result } = renderHook(() => useRecommendations({ autoRetry: true, retryDelay: 1000 }));

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      // Fast-forward time to trigger retry
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.recommendations).toEqual(mockRecommendations);
        expect(result.current.error).toBe(null);
      });

      expect(recommendationService.fetchRecommendations).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('does not auto-retry validation errors', async () => {
      vi.useFakeTimers();

      recommendationService.fetchRecommendations.mockRejectedValue(
        new Error('VALIDATION_ERROR: Invalid input')
      );

      const { result } = renderHook(() => useRecommendations({ autoRetry: true }));

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('VALIDATION_ERROR: Invalid input');
      });

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should not have retried
      expect(recommendationService.fetchRecommendations).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('provides retry function', async () => {
      const { result } = renderHook(() => useRecommendations());

      // Set error state
      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      recommendationService.fetchRecommendations.mockResolvedValue(mockErrorResult);

      await waitFor(() => {
        expect(result.current.error).toBe('API Error');
      });

      // Retry should clear error
      act(() => {
        result.current.retry();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('clearRecommendations', () => {
    it('clears all state', async () => {
      recommendationService.fetchRecommendations.mockResolvedValue(mockSuccessResult);

      const { result } = renderHook(() => useRecommendations());

      // First set some state
      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.recommendations).toHaveLength(2);
      });

      // Then clear it
      act(() => {
        result.current.clearRecommendations();
      });

      expect(result.current.recommendations).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.metadata).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastFetchTime).toBe(null);
    });
  });

  describe('computed values', () => {
    it('calculates computed values correctly', async () => {
      const { result } = renderHook(() => useRecommendations());

      // Initially empty
      expect(result.current.hasRecommendations).toBe(false);
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.totalFound).toBe(0);

      // After successful fetch
      recommendationService.fetchRecommendations.mockResolvedValue(mockSuccessResult);

      act(() => {
        result.current.fetchRecommendations(mockEntities);
      });

      await waitFor(() => {
        expect(result.current.hasRecommendations).toBe(true);
        expect(result.current.isEmpty).toBe(false);
        expect(result.current.totalFound).toBe(2);
        expect(result.current.processingTime).toBe(150);
        expect(result.current.isFromCache).toBe(false);
      });
    });
  });

  describe('service integration', () => {
    it('provides service stats', () => {
      const { result } = renderHook(() => useRecommendations());

      const stats = result.current.getStats();
      expect(stats).toHaveProperty('cacheSize');
      expect(recommendationService.getStats).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('cancels requests on unmount', () => {
      const { unmount } = renderHook(() => useRecommendations());

      // This test mainly ensures no errors occur during cleanup
      unmount();
    });
  });
});