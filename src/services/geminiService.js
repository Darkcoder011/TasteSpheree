import { ENTITY_TYPES } from '../config/api.js';
import networkService from './networkService.js';
import errorService from './errorService.js';

/**
 * Mock Gemini API service for entity extraction from natural language input
 * This service simulates the behavior of Google's Gemini LLM for extracting
 * entities and their types from user input text.
 */

// Mock entity patterns for different types
const ENTITY_PATTERNS = {
  [ENTITY_TYPES.MOVIE]: [
    /\b(?:movie|film|cinema|flick)s?\b/i,
    /\b(?:sci-?fi|horror|comedy|drama|action|thriller|romance|documentary)\s+(?:movie|film)s?\b/i,
    /\b(?:Marvel|DC|Disney|Pixar)\s+(?:movie|film)s?\b/i,
    /\b(?:Star Wars|Harry Potter|Lord of the Rings|Marvel|Batman|Superman)\b/i
  ],
  [ENTITY_TYPES.ARTIST]: [
    /\b(?:music|song|album|artist|band|singer|musician)s?\b/i,
    /\b(?:rock|pop|jazz|classical|hip-hop|rap|country|folk|electronic|indie)\s+(?:music|artist|band)s?\b/i,
    /\b(?:Beatles|Taylor Swift|Drake|Beyoncé|Ed Sheeran|Adele)\b/i
  ],
  [ENTITY_TYPES.BOOK]: [
    /\b(?:book|novel|literature|reading|author|writer)s?\b/i,
    /\b(?:fiction|non-fiction|mystery|romance|fantasy|sci-fi|biography)\s+(?:book|novel)s?\b/i,
    /\b(?:Stephen King|J.K. Rowling|George R.R. Martin|Agatha Christie)\b/i
  ],
  [ENTITY_TYPES.DESTINATION]: [
    /\b(?:travel|destination|vacation|trip|visit|explore)s?\b/i,
    /\b(?:beach|mountain|city|country|island|resort)s?\b/i,
    /\b(?:Paris|Tokyo|New York|London|Rome|Bali|Hawaii)\b/i
  ],
  [ENTITY_TYPES.TV_SHOW]: [
    /\b(?:TV|television|series|show|episode|season)s?\b/i,
    /\b(?:Netflix|HBO|Disney\+|Amazon Prime|Hulu)\s+(?:show|series)\b/i,
    /\b(?:Game of Thrones|Breaking Bad|Friends|The Office|Stranger Things)\b/i
  ],
  [ENTITY_TYPES.PODCAST]: [
    /\b(?:podcast|audio|listen|episode)s?\b/i,
    /\b(?:true crime|comedy|news|interview|educational)\s+podcast\b/i,
    /\b(?:Joe Rogan|Serial|This American Life)\b/i
  ],
  [ENTITY_TYPES.PLACE]: [
    /\b(?:restaurant|cafe|bar|club|venue|place)s?\b/i,
    /\b(?:Italian|Chinese|Mexican|Japanese|French)\s+(?:restaurant|food|cuisine)\b/i,
    /\b(?:coffee shop|pizza place|sushi bar|steakhouse)\b/i
  ],
  [ENTITY_TYPES.BRAND]: [
    /\b(?:brand|company|product|shopping|buy)s?\b/i,
    /\b(?:Apple|Nike|Coca-Cola|McDonald's|Amazon|Google)\b/i,
    /\b(?:fashion|tech|automotive|food)\s+brand\b/i
  ],
  [ENTITY_TYPES.PERSON]: [
    /\b(?:actor|actress|celebrity|star|director|producer)\b/i,
    /\b(?:Tom Hanks|Meryl Streep|Leonardo DiCaprio|Jennifer Lawrence)\b/i,
    /\b(?:famous|well-known)\s+(?:person|people|celebrity)\b/i
  ]
};

// Mock confidence scoring based on pattern matches
const calculateConfidence = (input, entityType, matches) => {
  const baseConfidence = 0.6;
  const matchBonus = matches.length * 0.1;
  const lengthBonus = Math.min(input.length / 100, 0.2);
  
  return Math.min(baseConfidence + matchBonus + lengthBonus, 0.95);
};

// Extract context around matched entities
const extractContext = (input, match) => {
  const matchIndex = input.toLowerCase().indexOf(match.toLowerCase());
  const contextStart = Math.max(0, matchIndex - 20);
  const contextEnd = Math.min(input.length, matchIndex + match.length + 20);
  
  return input.substring(contextStart, contextEnd).trim();
};

// Generate mock entities based on input analysis
const generateMockEntities = (input) => {
  const entities = [];
  const processedMatches = new Set();

  Object.entries(ENTITY_PATTERNS).forEach(([entityType, patterns]) => {
    const matches = [];
    
    patterns.forEach(pattern => {
      const patternMatches = input.match(pattern);
      if (patternMatches) {
        patternMatches.forEach(match => {
          if (!processedMatches.has(match.toLowerCase())) {
            matches.push(match);
            processedMatches.add(match.toLowerCase());
          }
        });
      }
    });

    if (matches.length > 0) {
      matches.forEach(match => {
        entities.push({
          name: match.trim(),
          type: entityType,
          confidence: calculateConfidence(input, entityType, matches),
          context: extractContext(input, match)
        });
      });
    }
  });

  // Sort by confidence score
  return entities.sort((a, b) => b.confidence - a.confidence);
};

// Simulate processing delay
const simulateProcessingDelay = () => {
  return new Promise(resolve => {
    const delay = Math.random() * 1000 + 500; // 500-1500ms delay
    setTimeout(resolve, delay);
  });
};

/**
 * Mock Gemini service class for entity extraction
 */
export class GeminiService {
  constructor() {
    this.isInitialized = true;
    this.requestCount = 0;
    this.maxRequestsPerMinute = 60;
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
   * Extract entities from natural language input
   * @param {string} input - User's natural language input
   * @returns {Promise<EntityAnalysis>} - Analysis results with entities
   */
  async extractEntities(input) {
    const startTime = Date.now();
    const endpoint = 'gemini-api/extract-entities';

    const requestFn = async () => {
      // Validate input
      if (!input || typeof input !== 'string') {
        throw new Error('Invalid input: Input must be a non-empty string');
      }

      if (input.trim().length === 0) {
        throw new Error('Invalid input: Input cannot be empty');
      }

      if (input.length > 1000) {
        throw new Error('Invalid input: Input too long (max 1000 characters)');
      }

      // Check rate limiting
      if (!this.checkRateLimit()) {
        const error = new Error('Rate limit exceeded. Please try again in a moment.');
        error.status = 429;
        throw error;
      }

      // Record request timestamp
      this.requestTimestamps.push(Date.now());
      this.requestCount++;

      // Simulate network conditions and potential failures
      await this.simulateNetworkConditions();

      // Simulate processing delay
      await simulateProcessingDelay();

      // Extract entities using mock patterns
      const entities = generateMockEntities(input.trim());

      const processingTime = Date.now() - startTime;
      const confidence = entities.length > 0 
        ? entities.reduce((sum, entity) => sum + entity.confidence, 0) / entities.length
        : 0;

      return {
        entities,
        confidence: Math.round(confidence * 100) / 100,
        processingTime,
        inputLength: input.length,
        timestamp: new Date().toISOString(),
        originalInput: input.trim(),
        rawResponse: {
          status: 'success',
          entityCount: entities.length,
          processingSteps: [
            'Input validation',
            'Pattern matching',
            'Entity extraction',
            'Confidence scoring',
            'Result formatting'
          ],
          metadata: {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            version: '1.0.0',
            model: 'gemini-mock'
          }
        }
      };
    };

    try {
      return await networkService.executeWithRetry(
        requestFn,
        endpoint,
        'POST',
        {
          maxRetries: 3,
          onRetry: (error, attempt, delay) => {
            errorService.logApiError(error, endpoint, 'POST', { input: input.substring(0, 100) });
            console.log(`Retrying Gemini API call (attempt ${attempt}) after ${delay}ms delay`);
          },
          onError: (error, attempts) => {
            errorService.logApiError(error, endpoint, 'POST', { 
              input: input.substring(0, 100),
              totalAttempts: attempts
            });
          }
        }
      );
    } catch (error) {
      // Enhanced error handling with different error types
      if (error.status === 429 || error.message.includes('Rate limit')) {
        throw new Error(`RATE_LIMIT: ${error.message}`);
      } else if (error.message.includes('Invalid input')) {
        throw new Error(`VALIDATION_ERROR: ${error.message}`);
      } else if (error.name === 'NetworkError' || error.name === 'TimeoutError' || error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error(`NETWORK_ERROR: Failed to connect to Gemini API - ${networkService.getErrorMessage(error)}`);
      } else {
        throw new Error(`PROCESSING_ERROR: ${error.message}`);
      }
    }
  }

  /**
   * Generate a conversational response based on extracted entities
   * @param {Array} entities - Array of extracted entities
   * @returns {Promise<string>} - Generated response text
   */
  async generateResponse(entities) {
    try {
      if (!entities || !Array.isArray(entities)) {
        throw new Error('Invalid entities: Must be an array');
      }

      // Simulate processing delay
      await simulateProcessingDelay();

      if (entities.length === 0) {
        return "I couldn't identify any specific interests from your message. Could you tell me more about what you're looking for? For example, mention movies, music, books, or places you enjoy.";
      }

      const entityTypes = [...new Set(entities.map(e => e.type))];
      const entityNames = entities.map(e => e.name).slice(0, 3); // Limit to first 3

      let response = "Great! I found some interesting preferences in your message. ";

      if (entityTypes.length === 1) {
        response += `You seem interested in ${entityTypes[0]}s`;
      } else {
        response += `You mentioned interests in ${entityTypes.slice(0, -1).join(', ')} and ${entityTypes[entityTypes.length - 1]}`;
      }

      if (entityNames.length > 0) {
        response += `, particularly around ${entityNames.join(', ')}`;
      }

      response += ". Let me find some personalized recommendations for you!";

      return response;

    } catch (error) {
      throw new Error(`RESPONSE_GENERATION_ERROR: ${error.message}`);
    }
  }

  /**
   * Get service status and statistics
   * @returns {Object} - Service status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      requestCount: this.requestCount,
      rateLimitRemaining: this.maxRequestsPerMinute - this.requestTimestamps.length,
      lastRequestTime: this.requestTimestamps.length > 0 
        ? new Date(this.requestTimestamps[this.requestTimestamps.length - 1]).toISOString()
        : null
    };
  }

  /**
   * Simulate network conditions and potential failures for testing
   */
  async simulateNetworkConditions() {
    // Simulate network failures occasionally (5% chance)
    if (Math.random() < 0.05) {
      const errorTypes = [
        () => {
          const error = new Error('Network error');
          error.name = 'NetworkError';
          return error;
        },
        () => {
          const error = new Error('Request timeout');
          error.name = 'TimeoutError';
          return error;
        },
        () => {
          const error = new Error('Service temporarily unavailable');
          error.status = 503;
          return error;
        }
      ];
      
      const errorFn = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      throw errorFn();
    }

    // Simulate slow network (10% chance)
    if (Math.random() < 0.1) {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    }
  }

  /**
   * Reset service state (useful for testing)
   */
  reset() {
    this.requestCount = 0;
    this.requestTimestamps = [];
  }
}

// Export singleton instance
export const geminiService = new GeminiService();

// Export for testing
export { ENTITY_PATTERNS, calculateConfidence, extractContext, generateMockEntities };