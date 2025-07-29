import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  GeminiService, 
  geminiService,
  ENTITY_PATTERNS,
  calculateConfidence,
  extractContext,
  generateMockEntities
} from '../geminiService.js';
import { ENTITY_TYPES } from '../../config/api.js';

// Mock timers for testing delays
vi.mock('setTimeout', () => ({
  default: (fn, delay) => {
    fn();
    return 1;
  }
}));

describe('GeminiService', () => {
  let service;

  beforeEach(() => {
    service = new GeminiService();
    service.reset();
  });

  describe('Constructor', () => {
    it('should initialize with correct default values', () => {
      expect(service.isInitialized).toBe(true);
      expect(service.requestCount).toBe(0);
      expect(service.maxRequestsPerMinute).toBe(60);
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
      for (let i = 0; i < 60; i++) {
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

  describe('extractEntities', () => {
    it('should extract movie entities correctly', async () => {
      const input = "I love sci-fi movies and Marvel films";
      const result = await service.extractEntities(input);
      
      expect(result.entities).toBeDefined();
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.entities.some(e => e.type === ENTITY_TYPES.MOVIE)).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should extract music/artist entities correctly', async () => {
      const input = "I enjoy indie music and rock bands";
      const result = await service.extractEntities(input);
      
      expect(result.entities).toBeDefined();
      expect(result.entities.some(e => e.type === ENTITY_TYPES.ARTIST)).toBe(true);
    });

    it('should extract multiple entity types', async () => {
      const input = "I like sci-fi movies, indie music, and travel to beaches";
      const result = await service.extractEntities(input);
      
      const entityTypes = result.entities.map(e => e.type);
      expect(entityTypes).toContain(ENTITY_TYPES.MOVIE);
      expect(entityTypes).toContain(ENTITY_TYPES.ARTIST);
      expect(entityTypes).toContain(ENTITY_TYPES.DESTINATION);
    });

    it('should handle empty input', async () => {
      await expect(service.extractEntities("")).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should handle null input', async () => {
      await expect(service.extractEntities(null)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should handle undefined input', async () => {
      await expect(service.extractEntities(undefined)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should handle non-string input', async () => {
      await expect(service.extractEntities(123)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should handle input that is too long', async () => {
      const longInput = 'a'.repeat(1001);
      await expect(service.extractEntities(longInput)).rejects.toThrow('VALIDATION_ERROR');
    });

    it('should enforce rate limiting', async () => {
      // Fill up rate limit
      for (let i = 0; i < 60; i++) {
        service.requestTimestamps.push(Date.now());
      }
      
      await expect(service.extractEntities("test input")).rejects.toThrow('RATE_LIMIT');
    });

    it('should return entities sorted by confidence', async () => {
      const input = "I love Marvel movies and sci-fi films and action movies";
      const result = await service.extractEntities(input);
      
      for (let i = 1; i < result.entities.length; i++) {
        expect(result.entities[i-1].confidence).toBeGreaterThanOrEqual(result.entities[i].confidence);
      }
    });

    it('should include context for each entity', async () => {
      const input = "I really enjoy watching sci-fi movies on weekends";
      const result = await service.extractEntities(input);
      
      result.entities.forEach(entity => {
        expect(entity.context).toBeDefined();
        expect(typeof entity.context).toBe('string');
        expect(entity.context.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateResponse', () => {
    it('should generate response for single entity type', async () => {
      const entities = [
        { name: 'sci-fi movies', type: ENTITY_TYPES.MOVIE, confidence: 0.8 }
      ];
      
      const response = await service.generateResponse(entities);
      
      expect(response).toContain('movie');
      expect(response).toContain('recommendations');
    });

    it('should generate response for multiple entity types', async () => {
      const entities = [
        { name: 'sci-fi movies', type: ENTITY_TYPES.MOVIE, confidence: 0.8 },
        { name: 'indie music', type: ENTITY_TYPES.ARTIST, confidence: 0.7 }
      ];
      
      const response = await service.generateResponse(entities);
      
      expect(response).toContain('movie');
      expect(response).toContain('artist');
    });

    it('should handle empty entities array', async () => {
      const response = await service.generateResponse([]);
      
      expect(response).toContain("couldn't identify");
      expect(response).toContain("tell me more");
    });

    it('should handle null entities', async () => {
      await expect(service.generateResponse(null)).rejects.toThrow('RESPONSE_GENERATION_ERROR');
    });

    it('should handle non-array entities', async () => {
      await expect(service.generateResponse("not an array")).rejects.toThrow('RESPONSE_GENERATION_ERROR');
    });

    it('should limit entity names in response', async () => {
      const entities = [
        { name: 'entity1', type: ENTITY_TYPES.MOVIE, confidence: 0.8 },
        { name: 'entity2', type: ENTITY_TYPES.MOVIE, confidence: 0.7 },
        { name: 'entity3', type: ENTITY_TYPES.MOVIE, confidence: 0.6 },
        { name: 'entity4', type: ENTITY_TYPES.MOVIE, confidence: 0.5 },
        { name: 'entity5', type: ENTITY_TYPES.MOVIE, confidence: 0.4 }
      ];
      
      const response = await service.generateResponse(entities);
      
      // Should only mention first 3 entities
      expect(response).toContain('entity1');
      expect(response).toContain('entity2');
      expect(response).toContain('entity3');
      expect(response).not.toContain('entity4');
      expect(response).not.toContain('entity5');
    });
  });

  describe('getStatus', () => {
    it('should return correct status information', () => {
      service.requestCount = 5;
      service.requestTimestamps = [Date.now()];
      
      const status = service.getStatus();
      
      expect(status.isInitialized).toBe(true);
      expect(status.requestCount).toBe(5);
      expect(status.rateLimitRemaining).toBe(59);
      expect(status.lastRequestTime).toBeDefined();
    });

    it('should handle no previous requests', () => {
      const status = service.getStatus();
      
      expect(status.lastRequestTime).toBeNull();
      expect(status.rateLimitRemaining).toBe(60);
    });
  });

  describe('reset', () => {
    it('should reset service state', () => {
      service.requestCount = 10;
      service.requestTimestamps = [Date.now(), Date.now()];
      
      service.reset();
      
      expect(service.requestCount).toBe(0);
      expect(service.requestTimestamps).toEqual([]);
    });
  });
});

describe('Utility Functions', () => {
  describe('calculateConfidence', () => {
    it('should calculate confidence based on matches and input length', () => {
      const input = "I love sci-fi movies and action films";
      const matches = ['sci-fi movies', 'action films'];
      
      const confidence = calculateConfidence(input, ENTITY_TYPES.MOVIE, matches);
      
      expect(confidence).toBeGreaterThan(0.6);
      expect(confidence).toBeLessThanOrEqual(0.95);
    });

    it('should cap confidence at 0.95', () => {
      const input = "a".repeat(1000);
      const matches = new Array(10).fill('match');
      
      const confidence = calculateConfidence(input, ENTITY_TYPES.MOVIE, matches);
      
      expect(confidence).toBe(0.95);
    });
  });

  describe('extractContext', () => {
    it('should extract context around a match', () => {
      const input = "I really love watching sci-fi movies on weekends with friends";
      const match = "sci-fi movies";
      
      const context = extractContext(input, match);
      
      expect(context).toContain("sci-fi movies");
      expect(context.length).toBeLessThanOrEqual(input.length);
    });

    it('should handle matches at the beginning of input', () => {
      const input = "Movies are great entertainment";
      const match = "Movies";
      
      const context = extractContext(input, match);
      
      expect(context).toContain("Movies");
    });

    it('should handle matches at the end of input', () => {
      const input = "I enjoy watching movies";
      const match = "movies";
      
      const context = extractContext(input, match);
      
      expect(context).toContain("movies");
    });
  });

  describe('generateMockEntities', () => {
    it('should generate entities from input text', () => {
      const input = "I love sci-fi movies and indie music";
      
      const entities = generateMockEntities(input);
      
      expect(entities).toBeInstanceOf(Array);
      expect(entities.length).toBeGreaterThan(0);
      expect(entities.every(e => e.name && e.type && e.confidence && e.context)).toBe(true);
    });

    it('should return entities sorted by confidence', () => {
      const input = "Marvel movies and sci-fi films and action movies";
      
      const entities = generateMockEntities(input);
      
      for (let i = 1; i < entities.length; i++) {
        expect(entities[i-1].confidence).toBeGreaterThanOrEqual(entities[i].confidence);
      }
    });

    it('should avoid duplicate entities', () => {
      const input = "movies movies movies";
      
      const entities = generateMockEntities(input);
      
      const names = entities.map(e => e.name.toLowerCase());
      const uniqueNames = [...new Set(names)];
      
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should return empty array for no matches', () => {
      const input = "xyz abc def";
      
      const entities = generateMockEntities(input);
      
      expect(entities).toEqual([]);
    });
  });

  describe('ENTITY_PATTERNS', () => {
    it('should have patterns for all entity types', () => {
      Object.values(ENTITY_TYPES).forEach(entityType => {
        expect(ENTITY_PATTERNS[entityType]).toBeDefined();
        expect(ENTITY_PATTERNS[entityType]).toBeInstanceOf(Array);
        expect(ENTITY_PATTERNS[entityType].length).toBeGreaterThan(0);
      });
    });

    it('should have valid regex patterns', () => {
      Object.values(ENTITY_PATTERNS).forEach(patterns => {
        patterns.forEach(pattern => {
          expect(pattern).toBeInstanceOf(RegExp);
          // Test that pattern doesn't throw when used
          expect(() => "test".match(pattern)).not.toThrow();
        });
      });
    });
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(geminiService).toBeInstanceOf(GeminiService);
    expect(geminiService.isInitialized).toBe(true);
  });

  it('should maintain state across imports', async () => {
    await geminiService.extractEntities("test input");
    
    expect(geminiService.requestCount).toBe(1);
  });
});