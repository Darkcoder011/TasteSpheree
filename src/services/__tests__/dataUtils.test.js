import { describe, it, expect, beforeEach } from 'vitest';
import {
  mapEntityTypeToUrn,
  mapUrnToEntityType,
  isValidEntityType,
  getSupportedEntityTypes,
  isValidEntity,
  filterValidEntities,
  groupEntitiesByType,
  transformQlooResponse,
  generateSignalEntityIds,
  normalizeEntityName,
  calculateNameSimilarity,
  deduplicateRecommendations,
  sortRecommendations,
  isValidQlooResponse,
  createErrorResponse,
  mergeRecommendations
} from '../dataUtils.js';
import { ENTITY_TYPES, QLOO_ENTITY_URNS, DEFAULT_SIGNAL_ENTITY } from '../../config/api.js';

describe('Data Utilities', () => {
  describe('mapEntityTypeToUrn', () => {
    it('should map valid entity types to URNs', () => {
      expect(mapEntityTypeToUrn('movie')).toBe('urn:entity:movie');
      expect(mapEntityTypeToUrn('artist')).toBe('urn:entity:artist');
      expect(mapEntityTypeToUrn('book')).toBe('urn:entity:book');
    });

    it('should handle case insensitive input', () => {
      expect(mapEntityTypeToUrn('MOVIE')).toBe('urn:entity:movie');
      expect(mapEntityTypeToUrn('Movie')).toBe('urn:entity:movie');
      expect(mapEntityTypeToUrn('  movie  ')).toBe('urn:entity:movie');
    });

    it('should throw error for invalid entity types', () => {
      expect(() => mapEntityTypeToUrn('invalid')).toThrow('Unsupported entity type');
      expect(() => mapEntityTypeToUrn('')).toThrow('Entity type must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => mapEntityTypeToUrn(null)).toThrow('Entity type must be a non-empty string');
      expect(() => mapEntityTypeToUrn(undefined)).toThrow('Entity type must be a non-empty string');
      expect(() => mapEntityTypeToUrn(123)).toThrow('Entity type must be a non-empty string');
    });
  });

  describe('mapUrnToEntityType', () => {
    it('should map valid URNs to entity types', () => {
      expect(mapUrnToEntityType('urn:entity:movie')).toBe('movie');
      expect(mapUrnToEntityType('urn:entity:artist')).toBe('artist');
      expect(mapUrnToEntityType('urn:entity:book')).toBe('book');
    });

    it('should throw error for invalid URNs', () => {
      expect(() => mapUrnToEntityType('invalid:urn')).toThrow('Unknown URN');
      expect(() => mapUrnToEntityType('')).toThrow('URN must be a non-empty string');
    });

    it('should throw error for non-string input', () => {
      expect(() => mapUrnToEntityType(null)).toThrow('URN must be a non-empty string');
      expect(() => mapUrnToEntityType(undefined)).toThrow('URN must be a non-empty string');
      expect(() => mapUrnToEntityType(123)).toThrow('URN must be a non-empty string');
    });
  });

  describe('isValidEntityType', () => {
    it('should return true for valid entity types', () => {
      expect(isValidEntityType('movie')).toBe(true);
      expect(isValidEntityType('artist')).toBe(true);
      expect(isValidEntityType('MOVIE')).toBe(true);
      expect(isValidEntityType('  book  ')).toBe(true);
    });

    it('should return false for invalid entity types', () => {
      expect(isValidEntityType('invalid')).toBe(false);
      expect(isValidEntityType('')).toBe(false);
      expect(isValidEntityType(null)).toBe(false);
      expect(isValidEntityType(undefined)).toBe(false);
      expect(isValidEntityType(123)).toBe(false);
    });
  });

  describe('getSupportedEntityTypes', () => {
    it('should return array of supported entity types', () => {
      const types = getSupportedEntityTypes();
      
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('movie');
      expect(types).toContain('artist');
      expect(types).toContain('book');
    });
  });

  describe('isValidEntity', () => {
    it('should return true for valid entities', () => {
      const validEntity = { name: 'Inception', type: 'movie' };
      expect(isValidEntity(validEntity)).toBe(true);
    });

    it('should return false for entities without name', () => {
      expect(isValidEntity({ type: 'movie' })).toBe(false);
      expect(isValidEntity({ name: '', type: 'movie' })).toBe(false);
      expect(isValidEntity({ name: '   ', type: 'movie' })).toBe(false);
    });

    it('should return false for entities without type', () => {
      expect(isValidEntity({ name: 'Inception' })).toBe(false);
      expect(isValidEntity({ name: 'Inception', type: '' })).toBe(false);
    });

    it('should return false for entities with invalid type', () => {
      expect(isValidEntity({ name: 'Inception', type: 'invalid' })).toBe(false);
    });

    it('should return false for non-object input', () => {
      expect(isValidEntity(null)).toBe(false);
      expect(isValidEntity(undefined)).toBe(false);
      expect(isValidEntity('string')).toBe(false);
      expect(isValidEntity(123)).toBe(false);
    });
  });

  describe('filterValidEntities', () => {
    it('should filter out invalid entities', () => {
      const entities = [
        { name: 'Inception', type: 'movie' }, // valid
        { name: 'The Beatles', type: 'artist' }, // valid
        { name: '', type: 'movie' }, // invalid - empty name
        { name: 'Test', type: 'invalid' }, // invalid - invalid type
        { type: 'movie' }, // invalid - no name
        null, // invalid
        { name: 'Valid Book', type: 'book' } // valid
      ];

      const filtered = filterValidEntities(entities);
      
      expect(filtered).toHaveLength(3);
      expect(filtered[0].name).toBe('Inception');
      expect(filtered[1].name).toBe('The Beatles');
      expect(filtered[2].name).toBe('Valid Book');
    });

    it('should return empty array for non-array input', () => {
      expect(filterValidEntities(null)).toEqual([]);
      expect(filterValidEntities(undefined)).toEqual([]);
      expect(filterValidEntities('string')).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      expect(filterValidEntities([])).toEqual([]);
    });
  });

  describe('groupEntitiesByType', () => {
    it('should group entities by type', () => {
      const entities = [
        { name: 'Inception', type: 'movie' },
        { name: 'The Beatles', type: 'artist' },
        { name: 'Interstellar', type: 'movie' },
        { name: 'Pink Floyd', type: 'artist' }
      ];

      const grouped = groupEntitiesByType(entities);
      
      expect(grouped.movie).toHaveLength(2);
      expect(grouped.artist).toHaveLength(2);
      expect(grouped.movie[0].name).toBe('Inception');
      expect(grouped.movie[1].name).toBe('Interstellar');
    });

    it('should ignore invalid entities', () => {
      const entities = [
        { name: 'Inception', type: 'movie' },
        { name: '', type: 'movie' }, // invalid
        { name: 'Test', type: 'invalid' } // invalid
      ];

      const grouped = groupEntitiesByType(entities);
      
      expect(grouped.movie).toHaveLength(1);
      expect(Object.keys(grouped)).toHaveLength(1);
    });

    it('should return empty object for non-array input', () => {
      expect(groupEntitiesByType(null)).toEqual({});
      expect(groupEntitiesByType(undefined)).toEqual({});
      expect(groupEntitiesByType('string')).toEqual({});
    });
  });

  describe('transformQlooResponse', () => {
    it('should transform valid Qloo response', () => {
      const qlooResponse = {
        data: [
          {
            id: '1',
            name: 'Inception',
            score: 0.9,
            description: 'A sci-fi thriller',
            genre: 'sci-fi',
            year: 2010
          },
          {
            id: '2',
            title: 'Interstellar', // using title instead of name
            confidence: 0.8, // using confidence instead of score
            rating: 8.5
          }
        ]
      };

      const result = transformQlooResponse(qlooResponse, 'movie');
      
      expect(result).toHaveLength(2);
      
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Inception',
        type: 'movie',
        score: 0.9,
        source: 'qloo'
      });
      
      expect(result[0].metadata).toMatchObject({
        description: 'A sci-fi thriller',
        genre: 'sci-fi',
        year: 2010
      });

      expect(result[1]).toMatchObject({
        id: '2',
        name: 'Interstellar',
        type: 'movie',
        score: 0.8,
        source: 'qloo'
      });
    });

    it('should handle response without data', () => {
      expect(transformQlooResponse(null, 'movie')).toEqual([]);
      expect(transformQlooResponse({}, 'movie')).toEqual([]);
      expect(transformQlooResponse({ data: null }, 'movie')).toEqual([]);
    });

    it('should handle non-array data', () => {
      const response = { data: { id: '1', name: 'Test' } };
      expect(transformQlooResponse(response, 'movie')).toEqual([]);
    });

    it('should generate IDs for items without ID', () => {
      const response = {
        data: [
          { name: 'Test Movie' }
        ]
      };

      const result = transformQlooResponse(response, 'movie');
      
      expect(result[0].id).toMatch(/^movie_0_\d+$/);
    });

    it('should clamp scores to valid range', () => {
      const response = {
        data: [
          { name: 'High Score', score: 1.5 },
          { name: 'Low Score', score: -0.5 }
        ]
      };

      const result = transformQlooResponse(response, 'movie');
      
      expect(result[0].score).toBe(1);
      expect(result[1].score).toBe(0);
    });
  });

  describe('generateSignalEntityIds', () => {
    it('should generate signal IDs from valid entities', () => {
      const entities = [
        { name: 'Inception', type: 'movie' },
        { name: 'The Beatles', type: 'artist' },
        { name: 'Dune', type: 'book' }
      ];

      const signals = generateSignalEntityIds(entities);
      
      expect(signals).toHaveLength(3);
      expect(signals).toContain('Inception');
      expect(signals).toContain('The Beatles');
      expect(signals).toContain('Dune');
    });

    it('should limit to maxSignals', () => {
      const entities = [
        { name: 'Entity1', type: 'movie' },
        { name: 'Entity2', type: 'movie' },
        { name: 'Entity3', type: 'movie' },
        { name: 'Entity4', type: 'movie' }
      ];

      const signals = generateSignalEntityIds(entities, 2);
      
      expect(signals).toHaveLength(2);
    });

    it('should use entity ID if available', () => {
      const entities = [
        { id: 'custom-id', name: 'Test', type: 'movie' }
      ];

      const signals = generateSignalEntityIds(entities);
      
      expect(signals).toContain('custom-id');
    });

    it('should return default signal for empty or invalid input', () => {
      expect(generateSignalEntityIds([])).toEqual([DEFAULT_SIGNAL_ENTITY]);
      expect(generateSignalEntityIds(null)).toEqual([DEFAULT_SIGNAL_ENTITY]);
      expect(generateSignalEntityIds([{ name: '', type: 'invalid' }])).toEqual([DEFAULT_SIGNAL_ENTITY]);
    });
  });

  describe('normalizeEntityName', () => {
    it('should normalize entity names', () => {
      expect(normalizeEntityName('  The Dark Knight  ')).toBe('the dark knight');
      expect(normalizeEntityName('Spider-Man: No Way Home')).toBe('spider-man no way home');
      expect(normalizeEntityName('The Beatles!')).toBe('the beatles');
      expect(normalizeEntityName('Multiple   Spaces')).toBe('multiple spaces');
    });

    it('should handle invalid input', () => {
      expect(normalizeEntityName(null)).toBe('');
      expect(normalizeEntityName(undefined)).toBe('');
      expect(normalizeEntityName('')).toBe('');
      expect(normalizeEntityName(123)).toBe('');
    });
  });

  describe('calculateNameSimilarity', () => {
    it('should calculate similarity correctly', () => {
      expect(calculateNameSimilarity('Inception', 'Inception')).toBe(1);
      expect(calculateNameSimilarity('Inception', 'inception')).toBe(1);
      expect(calculateNameSimilarity('The Dark Knight', 'Dark Knight')).toBeGreaterThan(0.7);
      expect(calculateNameSimilarity('Inception', 'Interstellar')).toBeLessThan(0.5);
      expect(calculateNameSimilarity('', 'test')).toBe(0);
      expect(calculateNameSimilarity(null, 'test')).toBe(0);
    });
  });

  describe('deduplicateRecommendations', () => {
    it('should remove duplicate recommendations', () => {
      const recommendations = [
        { name: 'Inception', type: 'movie', score: 0.9 },
        { name: 'inception', type: 'movie', score: 0.8 }, // duplicate
        { name: 'Interstellar', type: 'movie', score: 0.7 },
        { name: 'The Beatles', type: 'artist', score: 0.9 }
      ];

      const deduplicated = deduplicateRecommendations(recommendations);
      
      expect(deduplicated).toHaveLength(3);
      expect(deduplicated.find(r => r.name === 'Inception').score).toBe(0.9); // Higher score kept
    });

    it('should handle empty or invalid input', () => {
      expect(deduplicateRecommendations([])).toEqual([]);
      expect(deduplicateRecommendations(null)).toEqual([]);
      expect(deduplicateRecommendations(undefined)).toEqual([]);
    });

    it('should respect similarity threshold', () => {
      const recommendations = [
        { name: 'The Dark Knight', type: 'movie', score: 0.9 },
        { name: 'Dark Knight', type: 'movie', score: 0.8 }
      ];

      // High threshold - should deduplicate
      const highThreshold = deduplicateRecommendations(recommendations, 0.7);
      expect(highThreshold).toHaveLength(1);

      // Low threshold - should not deduplicate
      const lowThreshold = deduplicateRecommendations(recommendations, 0.95);
      expect(lowThreshold).toHaveLength(2);
    });
  });

  describe('sortRecommendations', () => {
    const recommendations = [
      { name: 'B Movie', type: 'movie', score: 0.7, timestamp: '2023-01-01' },
      { name: 'A Movie', type: 'movie', score: 0.9, timestamp: '2023-01-02' },
      { name: 'C Artist', type: 'artist', score: 0.8, timestamp: '2023-01-03' }
    ];

    it('should sort by score descending by default', () => {
      const sorted = sortRecommendations(recommendations);
      
      expect(sorted[0].score).toBe(0.9);
      expect(sorted[1].score).toBe(0.8);
      expect(sorted[2].score).toBe(0.7);
    });

    it('should sort by name ascending', () => {
      const sorted = sortRecommendations(recommendations, { sortBy: 'name', order: 'asc' });
      
      expect(sorted[0].name).toBe('A Movie');
      expect(sorted[1].name).toBe('B Movie');
      expect(sorted[2].name).toBe('C Artist');
    });

    it('should sort by type', () => {
      const sorted = sortRecommendations(recommendations, { sortBy: 'type', order: 'asc' });
      
      expect(sorted[0].type).toBe('artist');
      expect(sorted[1].type).toBe('movie');
      expect(sorted[2].type).toBe('movie');
    });

    it('should group by type when requested', () => {
      const sorted = sortRecommendations(recommendations, { groupByType: true });
      
      expect(sorted[0].type).toBe('artist');
      expect(sorted[1].type).toBe('movie');
      expect(sorted[2].type).toBe('movie');
    });

    it('should handle empty or invalid input', () => {
      expect(sortRecommendations([])).toEqual([]);
      expect(sortRecommendations(null)).toEqual([]);
      expect(sortRecommendations(undefined)).toEqual([]);
    });
  });

  describe('isValidQlooResponse', () => {
    it('should validate correct Qloo responses', () => {
      expect(isValidQlooResponse({ data: [] })).toBe(true);
      expect(isValidQlooResponse({ data: [{ id: '1', name: 'Test' }] })).toBe(true);
      expect(isValidQlooResponse({ data: null })).toBe(true);
    });

    it('should reject invalid responses', () => {
      expect(isValidQlooResponse(null)).toBe(false);
      expect(isValidQlooResponse(undefined)).toBe(false);
      expect(isValidQlooResponse({})).toBe(false);
      expect(isValidQlooResponse({ data: 'string' })).toBe(false);
      expect(isValidQlooResponse({ data: 123 })).toBe(false);
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const error = createErrorResponse('Test error', 'TEST_ERROR', { detail: 'test' });
      
      expect(error.error).toBe(true);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details.detail).toBe('test');
      expect(error.timestamp).toBeDefined();
    });

    it('should use defaults for missing parameters', () => {
      const error = createErrorResponse();
      
      expect(error.message).toBe('An unknown error occurred');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.details).toEqual({});
    });
  });

  describe('mergeRecommendations', () => {
    const array1 = [
      { name: 'Movie A', type: 'movie', score: 0.9 },
      { name: 'Movie B', type: 'movie', score: 0.7 }
    ];
    
    const array2 = [
      { name: 'Movie A', type: 'movie', score: 0.8 }, // duplicate
      { name: 'Artist C', type: 'artist', score: 0.6 }
    ];

    it('should merge and deduplicate recommendations', () => {
      const merged = mergeRecommendations([array1, array2]);
      
      // Should have Movie A (deduplicated), Movie B, and Artist C
      expect(merged.length).toBeGreaterThanOrEqual(2);
      expect(merged.find(r => r.name === 'Movie A')).toBeDefined();
      
      // Check that the higher score was kept for Movie A
      const movieA = merged.find(r => r.name === 'Movie A');
      if (movieA) {
        expect(movieA.score).toBe(0.9); // Higher score kept
      }
    });

    it('should limit results', () => {
      const merged = mergeRecommendations([array1, array2], { maxResults: 2 });
      
      expect(merged).toHaveLength(2);
    });

    it('should handle empty or invalid input', () => {
      expect(mergeRecommendations([])).toEqual([]);
      expect(mergeRecommendations(null)).toEqual([]);
      expect(mergeRecommendations([null, undefined, 'string'])).toEqual([]);
    });

    it('should sort merged results', () => {
      const merged = mergeRecommendations([array1, array2], {
        sortOptions: { sortBy: 'score', order: 'desc' }
      });
      
      expect(merged.length).toBeGreaterThan(0);
      
      // Check that results are sorted by score descending
      for (let i = 1; i < merged.length; i++) {
        expect(merged[i-1].score).toBeGreaterThanOrEqual(merged[i].score);
      }
    });
  });
});