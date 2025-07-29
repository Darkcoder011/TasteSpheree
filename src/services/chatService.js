import { geminiService } from './geminiService.js';
import { qlooService } from './qlooService.js';

/**
 * Chat service for handling message processing workflow
 * Orchestrates entity extraction and recommendation fetching
 */

export class ChatService {
  constructor() {
    this.isProcessing = false;
    this.processingQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Process user input through the complete workflow
   * @param {string} input - User's natural language input
   * @param {Object} callbacks - Callback functions for different stages
   * @returns {Promise<Object>} - Processing result
   */
  async processUserInput(input, callbacks = {}) {
    const {
      onAnalysisStart,
      onAnalysisComplete,
      onAnalysisError,
      onRecommendationsStart,
      onRecommendationsComplete,
      onRecommendationsError,
      onComplete,
      onError
    } = callbacks;

    const processingId = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.isProcessing = true;

      // Stage 1: Entity extraction with Gemini
      if (onAnalysisStart) {
        onAnalysisStart({ processingId, input });
      }

      let analysisResult;
      try {
        analysisResult = await this.extractEntitiesWithRetry(input);
        
        if (onAnalysisComplete) {
          onAnalysisComplete({ 
            processingId, 
            analysis: analysisResult,
            entities: analysisResult.entities 
          });
        }
      } catch (error) {
        if (onAnalysisError) {
          onAnalysisError({ processingId, error, input });
        }
        throw new Error(`Entity extraction failed: ${error.message}`);
      }

      // Stage 2: Generate AI response
      let aiResponse;
      try {
        aiResponse = await geminiService.generateResponse(analysisResult.entities);
      } catch (error) {
        console.warn('AI response generation failed, using fallback:', error);
        aiResponse = this.generateFallbackResponse(analysisResult.entities);
      }

      // Stage 3: Fetch recommendations with Qloo
      let recommendations = [];
      if (analysisResult.entities.length > 0) {
        if (onRecommendationsStart) {
          onRecommendationsStart({ 
            processingId, 
            entities: analysisResult.entities 
          });
        }

        try {
          recommendations = await this.fetchRecommendationsWithRetry(analysisResult.entities);
          
          if (onRecommendationsComplete) {
            onRecommendationsComplete({ 
              processingId, 
              recommendations,
              count: recommendations.length 
            });
          }
        } catch (error) {
          if (onRecommendationsError) {
            onRecommendationsError({ processingId, error, entities: analysisResult.entities });
          }
          // Don't throw here - we can still show the AI response without recommendations
          console.warn('Recommendation fetching failed:', error);
        }
      }

      const result = {
        processingId,
        input,
        analysis: analysisResult,
        aiResponse,
        recommendations,
        timestamp: new Date().toISOString(),
        success: true
      };

      if (onComplete) {
        onComplete(result);
      }

      return result;

    } catch (error) {
      const errorResult = {
        processingId,
        input,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };

      if (onError) {
        onError(errorResult);
      }

      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extract entities with retry logic
   * @param {string} input - User input
   * @returns {Promise<Object>} - Analysis result
   */
  async extractEntitiesWithRetry(input) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await geminiService.extractEntities(input);
      } catch (error) {
        lastError = error;
        
        // Don't retry validation errors
        if (error.message.includes('VALIDATION_ERROR')) {
          throw error;
        }
        
        // Don't retry rate limit errors immediately
        if (error.message.includes('RATE_LIMIT')) {
          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelay * attempt * 2); // Exponential backoff
            continue;
          }
          throw error;
        }
        
        // Retry network and processing errors
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Fetch recommendations with retry logic
   * @param {Array} entities - Extracted entities
   * @returns {Promise<Array>} - Recommendations
   */
  async fetchRecommendationsWithRetry(entities) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await qlooService.getRecommendations(entities);
      } catch (error) {
        lastError = error;
        
        // Don't retry validation errors
        if (error.message.includes('VALIDATION_ERROR')) {
          throw error;
        }
        
        // Don't retry auth errors
        if (error.message.includes('AUTH_ERROR')) {
          throw error;
        }
        
        // Retry rate limit, network, and server errors
        if (attempt < this.maxRetries) {
          const delay = error.message.includes('RATE_LIMIT') 
            ? this.retryDelay * attempt * 3 // Longer delay for rate limits
            : this.retryDelay * attempt;
          
          await this.delay(delay);
          continue;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Generate fallback response when AI response generation fails
   * @param {Array} entities - Extracted entities
   * @returns {string} - Fallback response
   */
  generateFallbackResponse(entities) {
    if (entities.length === 0) {
      return "I'd love to help you find recommendations! Could you tell me more about your interests? For example, mention specific movies, music genres, books, or places you enjoy.";
    }

    const entityTypes = [...new Set(entities.map(e => e.type))];
    const entityNames = entities.slice(0, 3).map(e => e.name);

    let response = "Thanks for sharing your interests! ";
    
    if (entityTypes.length === 1) {
      response += `I can see you're interested in ${entityTypes[0]}s`;
    } else {
      response += `I found interests in ${entityTypes.slice(0, -1).join(', ')} and ${entityTypes[entityTypes.length - 1]}`;
    }

    if (entityNames.length > 0) {
      response += `, especially ${entityNames.join(', ')}`;
    }

    response += ". Let me find some great recommendations for you!";

    return response;
  }

  /**
   * Retry a failed operation
   * @param {string} input - Original user input
   * @param {Object} callbacks - Callback functions
   * @returns {Promise<Object>} - Processing result
   */
  async retryProcessing(input, callbacks = {}) {
    return this.processUserInput(input, callbacks);
  }

  /**
   * Get processing status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.processingQueue.length,
      geminiStatus: geminiService.getStatus(),
      qlooStatus: qlooService.getStatus()
    };
  }

  /**
   * Utility function for delays
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
    this.isProcessing = false;
    this.processingQueue = [];
    geminiService.reset();
    qlooService.reset();
  }
}

// Export singleton instance
export const chatService = new ChatService();

export default chatService;