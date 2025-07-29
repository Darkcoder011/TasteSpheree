import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatService, chatService } from '../chatService.js';
import { geminiService } from '../geminiService.js';
import { qlooService } from '../qlooService.js';

// Mock the services
vi.mock('../geminiService.js', () => ({
  geminiService: {
    extractEntities: vi.fn(),
    generateResponse: vi.fn(),
    reset: vi.fn()
  }
}));

vi.mock('../qlooService.js', () => ({
  qlooService: {
    getRecommendations: vi.fn(),
    reset: vi.fn(),
    getStatus: vi.fn(() => ({ requestCount: 0 }))
  }
}));

describe('ChatService', () => {
  let service;
  let mockCallbacks;

  beforeEach(() => {
    service = new ChatService();
    mockCallbacks = {
      onAnalysisStart: vi.fn(),
      onAnalysisComplete: vi.fn(),
      onAnalysisError: vi.fn(),
      onRecommendationsStart: vi.fn(),
      onRecommendationsComplete: vi.fn(),
      onRecommendationsError: vi.fn(),
      onComplete: vi.fn(),
      onError: vi.fn()
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('processUserInput', () => {
    it('should process input successfully with entities and recommendations', async () => {
      const input = 'I love sci-fi movies';
      const mockAnalysis = {
        entities: [
          { name: 'sci-fi movies', type: 'movie', confidence: 0.8 }
        ],
        confidence: 0.8,
        processingTime: 500
      };
      const mockResponse = 'Great! I found some sci-fi movie recommendations for you.';
      const mockRecommendations = [
        { id: '1', name: 'Blade Runner', type: 'movie', score: 0.9 }
      ];

      geminiService.extractEntities.mockResolvedValue(mockAnalysis);
      geminiService.generateResponse.mockResolvedValue(mockResponse);
      qlooService.getRecommendations.mockResolvedValue(mockRecommendations);

      const result = await service.processUserInput(input, mockCallbacks);

      expect(result.success).toBe(true);
      expect(result.input).toBe(input);
      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.aiResponse).toBe(mockResponse);
      expect(result.recommendations).toEqual(mockRecommendations);

      // Verify callbacks were called
      expect(mockCallbacks.onAnalysisStart).toHaveBeenCalled();
      expect(mockCallbacks.onAnalysisComplete).toHaveBeenCalledWith({
        processingId: expect.any(String),
        analysis: mockAnalysis,
        entities: mockAnalysis.entities
      });
      expect(mockCallbacks.onRecommendationsStart).toHaveBeenCalled();
      expect(mockCallbacks.onRecommendationsComplete).toHaveBeenCalledWith({
        processingId: expect.any(String),
        recommendations: mockRecommendations,
        count: 1
      });
      expect(mockCallbacks.onComplete).toHaveBeenCalledWith(result);
    });

    it('should handle entity extraction failure', async () => {
      const input = 'test input';
      const error = new Error('VALIDATION_ERROR: Invalid input');

      geminiService.extractEntities.mockRejectedValue(error);

      await expect(service.processUserInput(input, mockCallbacks)).rejects.toThrow('Entity extraction failed');

      expect(mockCallbacks.onAnalysisStart).toHaveBeenCalled();
      expect(mockCallbacks.onAnalysisError).toHaveBeenCalledWith({
        processingId: expect.any(String),
        error,
        input
      });
      expect(mockCallbacks.onError).toHaveBeenCalled();
    });

    it('should continue processing even if recommendations fail', async () => {
      const input = 'I love sci-fi movies';
      const mockAnalysis = {
        entities: [
          { name: 'sci-fi movies', type: 'movie', confidence: 0.8 }
        ],
        confidence: 0.8,
        processingTime: 500
      };
      const mockResponse = 'Great! I found some interests.';

      geminiService.extractEntities.mockResolvedValue(mockAnalysis);
      geminiService.generateResponse.mockResolvedValue(mockResponse);
      qlooService.getRecommendations.mockRejectedValue(new Error('API Error'));

      const result = await service.processUserInput(input, mockCallbacks);

      expect(result.success).toBe(true);
      expect(result.aiResponse).toBe(mockResponse);
      expect(result.recommendations).toEqual([]);

      expect(mockCallbacks.onRecommendationsError).toHaveBeenCalled();
      expect(mockCallbacks.onComplete).toHaveBeenCalled();
    });

    it('should use fallback response when AI response generation fails', async () => {
      const input = 'I love sci-fi movies';
      const mockAnalysis = {
        entities: [
          { name: 'sci-fi movies', type: 'movie', confidence: 0.8 }
        ],
        confidence: 0.8,
        processingTime: 500
      };

      geminiService.extractEntities.mockResolvedValue(mockAnalysis);
      geminiService.generateResponse.mockRejectedValue(new Error('Response generation failed'));
      qlooService.getRecommendations.mockResolvedValue([]);

      const result = await service.processUserInput(input, mockCallbacks);

      expect(result.success).toBe(true);
      expect(result.aiResponse).toContain('Thanks for sharing your interests');
      expect(mockCallbacks.onComplete).toHaveBeenCalled();
    });

    it('should handle empty entities', async () => {
      const input = 'hello world';
      const mockAnalysis = {
        entities: [],
        confidence: 0,
        processingTime: 300
      };
      const mockResponse = "I couldn't identify any specific interests.";

      geminiService.extractEntities.mockResolvedValue(mockAnalysis);
      geminiService.generateResponse.mockResolvedValue(mockResponse);

      const result = await service.processUserInput(input, mockCallbacks);

      expect(result.success).toBe(true);
      expect(result.recommendations).toEqual([]);
      expect(mockCallbacks.onRecommendationsStart).not.toHaveBeenCalled();
      expect(mockCallbacks.onComplete).toHaveBeenCalled();
    });
  });

  describe('extractEntitiesWithRetry', () => {
    it('should retry on network errors', async () => {
      const input = 'test input';
      const mockAnalysis = { entities: [], confidence: 0, processingTime: 100 };

      geminiService.extractEntities
        .mockRejectedValueOnce(new Error('NETWORK_ERROR: Connection failed'))
        .mockResolvedValue(mockAnalysis);

      const result = await service.extractEntitiesWithRetry(input);

      expect(result).toEqual(mockAnalysis);
      expect(geminiService.extractEntities).toHaveBeenCalledTimes(2);
    });

    it('should not retry validation errors', async () => {
      const input = '';
      const error = new Error('VALIDATION_ERROR: Empty input');

      geminiService.extractEntities.mockRejectedValue(error);

      await expect(service.extractEntitiesWithRetry(input)).rejects.toThrow('VALIDATION_ERROR');
      expect(geminiService.extractEntities).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const input = 'test input';
      const error = new Error('NETWORK_ERROR: Connection failed');

      geminiService.extractEntities.mockRejectedValue(error);

      await expect(service.extractEntitiesWithRetry(input)).rejects.toThrow('NETWORK_ERROR');
      expect(geminiService.extractEntities).toHaveBeenCalledTimes(3);
    });
  });

  describe('fetchRecommendationsWithRetry', () => {
    it('should retry on rate limit errors', async () => {
      const entities = [{ name: 'test', type: 'movie' }];
      const mockRecommendations = [{ id: '1', name: 'Test Movie' }];

      qlooService.getRecommendations
        .mockRejectedValueOnce(new Error('RATE_LIMIT: Too many requests'))
        .mockResolvedValue(mockRecommendations);

      const result = await service.fetchRecommendationsWithRetry(entities);

      expect(result).toEqual(mockRecommendations);
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(2);
    });

    it('should not retry auth errors', async () => {
      const entities = [{ name: 'test', type: 'movie' }];
      const error = new Error('AUTH_ERROR: Invalid API key');

      qlooService.getRecommendations.mockRejectedValue(error);

      await expect(service.fetchRecommendationsWithRetry(entities)).rejects.toThrow('AUTH_ERROR');
      expect(qlooService.getRecommendations).toHaveBeenCalledTimes(1);
    });
  });

  describe('generateFallbackResponse', () => {
    it('should generate response for empty entities', () => {
      const response = service.generateFallbackResponse([]);
      
      expect(response).toContain("I'd love to help you find recommendations");
      expect(response).toContain("tell me more about your interests");
    });

    it('should generate response for single entity type', () => {
      const entities = [
        { name: 'sci-fi movies', type: 'movie', confidence: 0.8 }
      ];
      
      const response = service.generateFallbackResponse(entities);
      
      expect(response).toContain('movies');
      expect(response).toContain('sci-fi movies');
    });

    it('should generate response for multiple entity types', () => {
      const entities = [
        { name: 'sci-fi movies', type: 'movie', confidence: 0.8 },
        { name: 'indie music', type: 'artist', confidence: 0.7 },
        { name: 'fantasy books', type: 'book', confidence: 0.6 }
      ];
      
      const response = service.generateFallbackResponse(entities);
      
      expect(response).toContain('movies');
      expect(response).toContain('artists');
      expect(response).toContain('books');
      expect(response).toContain('sci-fi movies');
      expect(response).toContain('indie music');
      expect(response).toContain('fantasy books');
    });

    it('should limit entity names to 3', () => {
      const entities = [
        { name: 'entity1', type: 'movie', confidence: 0.8 },
        { name: 'entity2', type: 'movie', confidence: 0.7 },
        { name: 'entity3', type: 'movie', confidence: 0.6 },
        { name: 'entity4', type: 'movie', confidence: 0.5 },
        { name: 'entity5', type: 'movie', confidence: 0.4 }
      ];
      
      const response = service.generateFallbackResponse(entities);
      
      expect(response).toContain('entity1');
      expect(response).toContain('entity2');
      expect(response).toContain('entity3');
      expect(response).not.toContain('entity4');
      expect(response).not.toContain('entity5');
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      service.isProcessing = true;
      
      const status = service.getStatus();
      
      expect(status.isProcessing).toBe(true);
      expect(status.queueLength).toBe(0);
      expect(status.geminiStatus).toBeDefined();
      expect(status.qlooStatus).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset service state', () => {
      service.isProcessing = true;
      service.processingQueue = ['test'];
      
      service.reset();
      
      expect(service.isProcessing).toBe(false);
      expect(service.processingQueue).toEqual([]);
      expect(geminiService.reset).toHaveBeenCalled();
      expect(qlooService.reset).toHaveBeenCalled();
    });
  });
});

describe('Singleton Instance', () => {
  it('should export a singleton instance', () => {
    expect(chatService).toBeInstanceOf(ChatService);
  });
});