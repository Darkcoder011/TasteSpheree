// Qloo API Configuration for TasteSphere
export const QLOO_CONFIG = {
  baseUrl: 'https://hackathon.api.qloo.com',
  apiKey: 'qzuLeMriOgE8HuaHslZkpSs5fTu-VU4-iukY6dD6J8k',
  endpoints: {
    insights: '/v2/insights'
  },
  headers: {
    'X-Api-Key': 'qzuLeMriOgE8HuaHslZkpSs5fTu-VU4-iukY6dD6J8k'
  }
};

// Supported entity types from Qloo API
export const ENTITY_TYPES = {
  PLACE: 'place',
  MOVIE: 'movie',
  BRAND: 'brand', 
  PERSON: 'person',
  TV_SHOW: 'tv_show',
  PODCAST: 'podcast',
  BOOK: 'book',
  DESTINATION: 'destination',
  ARTIST: 'artist'
};

// Qloo API URN mapping for entity types
export const QLOO_ENTITY_URNS = {
  [ENTITY_TYPES.PLACE]: 'urn:entity:place',
  [ENTITY_TYPES.MOVIE]: 'urn:entity:movie',
  [ENTITY_TYPES.BRAND]: 'urn:entity:brand',
  [ENTITY_TYPES.PERSON]: 'urn:entity:person',
  [ENTITY_TYPES.TV_SHOW]: 'urn:entity:tv_show',
  [ENTITY_TYPES.PODCAST]: 'urn:entity:podcast',
  [ENTITY_TYPES.BOOK]: 'urn:entity:book',
  [ENTITY_TYPES.DESTINATION]: 'urn:entity:destination',
  [ENTITY_TYPES.ARTIST]: 'urn:entity:artist'
};

// Default signal entity ID for testing (from API examples)
export const DEFAULT_SIGNAL_ENTITY = 'FCE8B172-4795-43E4-B222-3B550DC05FD9';

// API request defaults
export const API_DEFAULTS = {
  take: 10, // Number of results to fetch
  maxTake: 50 // Maximum allowed by API
};