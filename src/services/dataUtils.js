import { ENTITY_TYPES, QLOO_ENTITY_URNS, DEFAULT_SIGNAL_ENTITY } from '../config/api.js';

/**
 * Data processing utilities for TasteSphere recommendation system
 * Handles entity type mapping, data transformation, and validation
 */

/**
 * Map entity type to Qloo URN format
 * @param {string} entityType - Entity type (e.g., 'movie', 'artist')
 * @returns {string} - Qloo URN format (e.g., 'urn:entity:movie')
 */
export const mapEntityTypeToUrn = (entityType) => {
  if (!entityType || typeof entityType !== 'string') {
    throw new Error('Entity type must be a non-empty string');
  }

  const normalizedType = entityType.toLowerCase().trim();
  
  if (normalizedType === '') {
    throw new Error(`Unsupported entity type: ${entityType}. Supported types: ${Object.values(ENTITY_TYPES).join(', ')}`);
  }
  
  const urn = QLOO_ENTITY_URNS[normalizedType];
  
  if (!urn) {
    throw new Error(`Unsupported entity type: ${entityType}. Supported types: ${Object.values(ENTITY_TYPES).join(', ')}`);
  }

  return urn;
};

/**
 * Map Qloo URN back to entity type
 * @param {string} urn - Qloo URN (e.g., 'urn:entity:movie')
 * @returns {string} - Entity type (e.g., 'movie')
 */
export const mapUrnToEntityType = (urn) => {
  if (!urn || typeof urn !== 'string') {
    throw new Error('URN must be a non-empty string');
  }

  const trimmedUrn = urn.trim();
  
  if (trimmedUrn === '') {
    throw new Error(`Unknown URN: ${urn}`);
  }

  // Find the entity type that matches this URN
  for (const [entityType, entityUrn] of Object.entries(QLOO_ENTITY_URNS)) {
    if (entityUrn === trimmedUrn) {
      return entityType;
    }
  }

  throw new Error(`Unknown URN: ${urn}`);
};

/**
 * Validate if entity type is supported by Qloo API
 * @param {string} entityType - Entity type to validate
 * @returns {boolean} - Whether the entity type is supported
 */
export const isValidEntityType = (entityType) => {
  if (!entityType || typeof entityType !== 'string') {
    return false;
  }

  const normalizedType = entityType.toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(QLOO_ENTITY_URNS, normalizedType);
};

/**
 * Get all supported entity types
 * @returns {Array<string>} - Array of supported entity types
 */
export const getSupportedEntityTypes = () => {
  return Object.values(ENTITY_TYPES);
};

/**
 * Validate entity object structure
 * @param {Object} entity - Entity object to validate
 * @returns {boolean} - Whether the entity is valid
 */
export const isValidEntity = (entity) => {
  if (!entity || typeof entity !== 'object') {
    return false;
  }

  // Must have name and type
  if (!entity.name || typeof entity.name !== 'string' || entity.name.trim().length === 0) {
    return false;
  }

  if (!entity.type || typeof entity.type !== 'string') {
    return false;
  }

  // Type must be supported
  return isValidEntityType(entity.type);
};

/**
 * Filter array of entities to only include valid ones
 * @param {Array<Object>} entities - Array of entity objects
 * @returns {Array<Object>} - Array of valid entities
 */
export const filterValidEntities = (entities) => {
  if (!Array.isArray(entities)) {
    return [];
  }

  return entities.filter(isValidEntity);
};

/**
 * Group entities by type
 * @param {Array<Object>} entities - Array of entity objects
 * @returns {Object} - Object with entity types as keys and arrays of entities as values
 */
export const groupEntitiesByType = (entities) => {
  if (!Array.isArray(entities)) {
    return {};
  }

  return entities.reduce((groups, entity) => {
    if (!isValidEntity(entity)) {
      return groups;
    }

    const type = entity.type.toLowerCase();
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(entity);
    return groups;
  }, {});
};

/**
 * Transform Qloo API response data to standardized format
 * @param {Object} qlooResponse - Raw Qloo API response
 * @param {string} entityType - The entity type that was requested
 * @returns {Array<Object>} - Array of standardized recommendation objects
 */
export const transformQlooResponse = (qlooResponse, entityType) => {
  if (!qlooResponse || !qlooResponse.data) {
    return [];
  }

  const data = Array.isArray(qlooResponse.data) ? qlooResponse.data : [];
  
  return data.map((item, index) => {
    const recommendation = {
      id: item.id || `${entityType}_${index}_${Date.now()}`,
      name: item.name || item.title || 'Unknown',
      type: entityType.toLowerCase(),
      score: parseFloat(item.score || item.confidence || Math.random() * 0.5 + 0.5),
      metadata: extractMetadata(item),
      source: 'qloo',
      timestamp: new Date().toISOString()
    };

    // Ensure score is within valid range
    recommendation.score = Math.max(0, Math.min(1, recommendation.score));

    return recommendation;
  });
};

/**
 * Extract and standardize metadata from Qloo response item
 * @param {Object} item - Individual item from Qloo response
 * @returns {Object} - Standardized metadata object
 */
const extractMetadata = (item) => {
  const metadata = {
    description: item.description || item.summary || '',
    category: item.category || item.genre || '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    url: item.url || item.link || '',
    imageUrl: item.image_url || item.imageUrl || item.image || '',
    rating: parseFloat(item.rating) || null,
    year: parseInt(item.year) || null,
    genre: item.genre || item.category || null,
    duration: item.duration || null,
    language: item.language || null,
    country: item.country || null,
    director: item.director || null,
    cast: Array.isArray(item.cast) ? item.cast : [],
    author: item.author || item.artist || null,
    publisher: item.publisher || item.label || null
  };

  // Clean up null/undefined values
  Object.keys(metadata).forEach(key => {
    if (metadata[key] === null || metadata[key] === undefined || metadata[key] === '') {
      delete metadata[key];
    }
  });

  // Include any additional fields from the original item
  Object.keys(item).forEach(key => {
    if (!metadata.hasOwnProperty(key) && key !== 'id' && key !== 'name' && key !== 'title' && key !== 'score' && key !== 'confidence') {
      metadata[key] = item[key];
    }
  });

  return metadata;
};

/**
 * Generate signal entity IDs for Qloo API
 * @param {Array<Object>} entities - Array of entity objects
 * @param {number} maxSignals - Maximum number of signal entities to return
 * @returns {Array<string>} - Array of signal entity IDs
 */
export const generateSignalEntityIds = (entities, maxSignals = 5) => {
  if (!Array.isArray(entities) || entities.length === 0) {
    return [DEFAULT_SIGNAL_ENTITY];
  }

  const validEntities = filterValidEntities(entities);
  if (validEntities.length === 0) {
    return [DEFAULT_SIGNAL_ENTITY];
  }

  // In a real implementation, these would be actual entity IDs from Qloo
  // For now, we'll use entity names as mock signal IDs
  const signalIds = validEntities
    .slice(0, maxSignals)
    .map(entity => entity.id || entity.name || DEFAULT_SIGNAL_ENTITY);

  return signalIds.length > 0 ? signalIds : [DEFAULT_SIGNAL_ENTITY];
};

/**
 * Normalize entity names for consistent processing
 * @param {string} name - Entity name to normalize
 * @returns {string} - Normalized entity name
 */
export const normalizeEntityName = (name) => {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Calculate similarity score between two entity names
 * @param {string} name1 - First entity name
 * @param {string} name2 - Second entity name
 * @returns {number} - Similarity score between 0 and 1
 */
export const calculateNameSimilarity = (name1, name2) => {
  if (!name1 || !name2) {
    return 0;
  }

  const normalized1 = normalizeEntityName(name1);
  const normalized2 = normalizeEntityName(name2);

  if (normalized1 === normalized2) {
    return 1;
  }

  // Simple Levenshtein distance-based similarity
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  return maxLength === 0 ? 0 : 1 - (distance / maxLength);
};

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Levenshtein distance
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Deduplicate recommendations based on name similarity
 * @param {Array<Object>} recommendations - Array of recommendation objects
 * @param {number} similarityThreshold - Similarity threshold for deduplication (0-1)
 * @returns {Array<Object>} - Deduplicated recommendations
 */
export const deduplicateRecommendations = (recommendations, similarityThreshold = 0.8) => {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return [];
  }

  const deduplicated = [];
  
  for (const recommendation of recommendations) {
    let isDuplicate = false;
    
    for (const existing of deduplicated) {
      const similarity = calculateNameSimilarity(recommendation.name, existing.name);
      if (similarity >= similarityThreshold && recommendation.type === existing.type) {
        isDuplicate = true;
        // Keep the one with higher score
        if (recommendation.score > existing.score) {
          const index = deduplicated.indexOf(existing);
          deduplicated[index] = recommendation;
        }
        break;
      }
    }
    
    if (!isDuplicate) {
      deduplicated.push(recommendation);
    }
  }

  return deduplicated;
};

/**
 * Sort recommendations by score and relevance
 * @param {Array<Object>} recommendations - Array of recommendation objects
 * @param {Object} options - Sorting options
 * @returns {Array<Object>} - Sorted recommendations
 */
export const sortRecommendations = (recommendations, options = {}) => {
  if (!Array.isArray(recommendations)) {
    return [];
  }

  const {
    sortBy = 'score', // 'score', 'name', 'type', 'timestamp'
    order = 'desc',   // 'asc', 'desc'
    groupByType = false
  } = options;

  let sorted = [...recommendations];

  // Sort by specified criteria
  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'score':
        comparison = (a.score || 0) - (b.score || 0);
        break;
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '');
        break;
      case 'type':
        comparison = (a.type || '').localeCompare(b.type || '');
        break;
      case 'timestamp':
        comparison = new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
        break;
      default:
        comparison = (a.score || 0) - (b.score || 0);
    }

    return order === 'desc' ? -comparison : comparison;
  });

  // Group by type if requested
  if (groupByType) {
    const grouped = groupEntitiesByType(sorted);
    sorted = [];
    
    // Sort types alphabetically and flatten
    Object.keys(grouped)
      .sort()
      .forEach(type => {
        sorted.push(...grouped[type]);
      });
  }

  return sorted;
};

/**
 * Validate Qloo API response structure
 * @param {Object} response - Qloo API response to validate
 * @returns {boolean} - Whether the response is valid
 */
export const isValidQlooResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  // Must have data property
  if (!response.hasOwnProperty('data')) {
    return false;
  }

  // Data should be an array or null
  if (response.data !== null && !Array.isArray(response.data)) {
    return false;
  }

  return true;
};

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} - Standardized error object
 */
export const createErrorResponse = (message, code = 'UNKNOWN_ERROR', details = {}) => {
  return {
    error: true,
    message: message || 'An unknown error occurred',
    code,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Merge multiple recommendation arrays and deduplicate
 * @param {Array<Array<Object>>} recommendationArrays - Arrays of recommendations to merge
 * @param {Object} options - Merge options
 * @returns {Array<Object>} - Merged and deduplicated recommendations
 */
export const mergeRecommendations = (recommendationArrays, options = {}) => {
  if (!Array.isArray(recommendationArrays)) {
    return [];
  }

  const {
    maxResults = 50,
    deduplicateThreshold = 0.8,
    sortOptions = { sortBy: 'score', order: 'desc' }
  } = options;

  // Flatten all arrays
  const allRecommendations = recommendationArrays
    .filter(Array.isArray)
    .flat()
    .filter(rec => rec && typeof rec === 'object');

  if (allRecommendations.length === 0) {
    return [];
  }

  // Deduplicate
  const deduplicated = deduplicateRecommendations(allRecommendations, deduplicateThreshold);

  // Sort
  const sorted = sortRecommendations(deduplicated, sortOptions);

  // Limit results
  return sorted.slice(0, maxResults);
};