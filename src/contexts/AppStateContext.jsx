import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import { ENTITY_TYPES } from '@config/api';

const AppStateContext = createContext();

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Initial state for the application
const initialState = {
  // Chat and messaging
  messages: [],
  currentInput: '',
  isProcessing: false,
  lastUserInput: '',
  
  // Recommendations and filtering
  recommendations: [],
  activeFilters: Object.keys(ENTITY_TYPES).reduce((acc, key) => {
    acc[ENTITY_TYPES[key]] = true; // All filters active by default
    return acc;
  }, {}),
  
  // Debug and analysis
  debugMode: false,
  lastAnalysis: null,
  
  // UI state
  showDebugPanel: false,
  isLoading: false,
  
  // Error handling
  error: null,
  
  // Session management
  sessionId: null,
  sessionStartTime: null
};

// Action types for state management
const APP_ACTIONS = {
  // Message actions
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_CURRENT_INPUT: 'SET_CURRENT_INPUT',
  SET_PROCESSING: 'SET_PROCESSING',
  SET_LAST_USER_INPUT: 'SET_LAST_USER_INPUT',
  
  // Recommendation actions
  SET_RECOMMENDATIONS: 'SET_RECOMMENDATIONS',
  ADD_RECOMMENDATIONS: 'ADD_RECOMMENDATIONS',
  CLEAR_RECOMMENDATIONS: 'CLEAR_RECOMMENDATIONS',
  
  // Filter actions
  TOGGLE_FILTER: 'TOGGLE_FILTER',
  SET_FILTER: 'SET_FILTER',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_ALL_FILTERS: 'SET_ALL_FILTERS',
  
  // Debug actions
  SET_DEBUG_MODE: 'SET_DEBUG_MODE',
  TOGGLE_DEBUG_MODE: 'TOGGLE_DEBUG_MODE',
  SET_LAST_ANALYSIS: 'SET_LAST_ANALYSIS',
  TOGGLE_DEBUG_PANEL: 'TOGGLE_DEBUG_PANEL',
  
  // UI actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Session actions
  START_SESSION: 'START_SESSION',
  END_SESSION: 'END_SESSION',
  
  // Bulk actions
  RESET_STATE: 'RESET_STATE',
  RESTORE_STATE: 'RESTORE_STATE'
};

// Generate unique message ID
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// App state reducer with complex state transitions
const appStateReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.ADD_MESSAGE: {
      const message = {
        id: generateMessageId(),
        timestamp: new Date(),
        ...action.payload
      };
      return {
        ...state,
        messages: [...state.messages, message]
      };
    }
    
    case APP_ACTIONS.UPDATE_MESSAGE: {
      const { id, updates } = action.payload;
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      };
    }
    
    case APP_ACTIONS.CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
        recommendations: [],
        lastAnalysis: null,
        currentInput: '',
        lastUserInput: '',
        error: null
      };
    
    case APP_ACTIONS.SET_CURRENT_INPUT:
      return {
        ...state,
        currentInput: action.payload
      };
    
    case APP_ACTIONS.SET_PROCESSING:
      return {
        ...state,
        isProcessing: action.payload
      };
    
    case APP_ACTIONS.SET_LAST_USER_INPUT:
      return {
        ...state,
        lastUserInput: action.payload
      };
    
    case APP_ACTIONS.SET_RECOMMENDATIONS:
      // Initialize active filters based on available entity types
      const entityTypes = [...new Set(action.payload.map(rec => rec.type))];
      const initialFilters = {};
      entityTypes.forEach(type => {
        initialFilters[type] = true; // All filters active by default
      });
      console.log('🔧 Initialized filters for entity types:', entityTypes, initialFilters);
      
      return {
        ...state,
        recommendations: action.payload,
        activeFilters: initialFilters,
        isLoading: false
      };
    
    case APP_ACTIONS.ADD_RECOMMENDATIONS:
      return {
        ...state,
        recommendations: [...state.recommendations, ...action.payload]
      };
    
    case APP_ACTIONS.CLEAR_RECOMMENDATIONS:
      return {
        ...state,
        recommendations: []
      };
    
    case APP_ACTIONS.TOGGLE_FILTER: {
      const filterType = action.payload;
      const newValue = !state.activeFilters[filterType];
      console.log('🔄 Toggling filter:', filterType, 'from', state.activeFilters[filterType], 'to', newValue);
      
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          [filterType]: newValue
        }
      };
    }
    
    case APP_ACTIONS.SET_FILTER: {
      const { filterType, value } = action.payload;
      return {
        ...state,
        activeFilters: {
          ...state.activeFilters,
          [filterType]: value
        }
      };
    }
    
    case APP_ACTIONS.RESET_FILTERS:
      return {
        ...state,
        activeFilters: Object.keys(ENTITY_TYPES).reduce((acc, key) => {
          acc[ENTITY_TYPES[key]] = true;
          return acc;
        }, {})
      };
    
    case APP_ACTIONS.SET_ALL_FILTERS: {
      const value = action.payload;
      return {
        ...state,
        activeFilters: Object.keys(state.activeFilters).reduce((acc, key) => {
          acc[key] = value;
          return acc;
        }, {})
      };
    }
    
    case APP_ACTIONS.SET_DEBUG_MODE:
      return {
        ...state,
        debugMode: action.payload
      };
    
    case APP_ACTIONS.TOGGLE_DEBUG_MODE:
      return {
        ...state,
        debugMode: !state.debugMode
      };
    
    case APP_ACTIONS.SET_LAST_ANALYSIS:
      return {
        ...state,
        lastAnalysis: action.payload
      };
    
    case APP_ACTIONS.TOGGLE_DEBUG_PANEL:
      return {
        ...state,
        showDebugPanel: !state.showDebugPanel
      };
    
    case APP_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case APP_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isProcessing: false
      };
    
    case APP_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case APP_ACTIONS.START_SESSION:
      return {
        ...state,
        sessionId: generateSessionId(),
        sessionStartTime: new Date()
      };
    
    case APP_ACTIONS.END_SESSION:
      return {
        ...state,
        sessionId: null,
        sessionStartTime: null
      };
    
    case APP_ACTIONS.RESET_STATE:
      return {
        ...initialState,
        debugMode: state.debugMode, // Preserve debug mode setting
        sessionId: state.sessionId,
        sessionStartTime: state.sessionStartTime
      };
    
    case APP_ACTIONS.RESTORE_STATE:
      return {
        ...state,
        ...action.payload
      };
    
    default:
      return state;
  }
};

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  // Initialize session on mount
  useEffect(() => {
    dispatch({ type: APP_ACTIONS.START_SESSION });
  }, []);

  // State persistence and recovery
  useEffect(() => {
    // Load persisted state on mount
    const persistedState = localStorage.getItem('tastesphere-app-state');
    if (persistedState) {
      try {
        const parsed = JSON.parse(persistedState);
        // Only restore certain parts of the state
        const stateToRestore = {
          debugMode: parsed.debugMode,
          activeFilters: parsed.activeFilters
        };
        dispatch({ type: APP_ACTIONS.RESTORE_STATE, payload: stateToRestore });
      } catch (error) {
        console.warn('Failed to restore app state:', error);
      }
    }
  }, []);

  // Persist certain state changes
  useEffect(() => {
    const stateToPersist = {
      debugMode: state.debugMode,
      activeFilters: state.activeFilters,
      sessionId: state.sessionId
    };
    
    localStorage.setItem('tastesphere-app-state', JSON.stringify(stateToPersist));
  }, [state.debugMode, state.activeFilters, state.sessionId]);

  // Message management actions
  const addMessage = useCallback((content, type = 'user', metadata = {}) => {
    dispatch({
      type: APP_ACTIONS.ADD_MESSAGE,
      payload: { content, type, ...metadata }
    });
  }, []);

  const updateMessage = useCallback((id, updates) => {
    dispatch({
      type: APP_ACTIONS.UPDATE_MESSAGE,
      payload: { id, updates }
    });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: APP_ACTIONS.CLEAR_MESSAGES });
  }, []);

  // Input management
  const setCurrentInput = useCallback((input) => {
    dispatch({ type: APP_ACTIONS.SET_CURRENT_INPUT, payload: input });
  }, []);

  const setProcessing = useCallback((isProcessing) => {
    dispatch({ type: APP_ACTIONS.SET_PROCESSING, payload: isProcessing });
  }, []);

  const setLastUserInput = useCallback((input) => {
    dispatch({ type: APP_ACTIONS.SET_LAST_USER_INPUT, payload: input });
  }, []);

  // Recommendation management
  const setRecommendations = useCallback((recommendations) => {
    dispatch({ type: APP_ACTIONS.SET_RECOMMENDATIONS, payload: recommendations });
  }, []);

  const addRecommendations = useCallback((recommendations) => {
    dispatch({ type: APP_ACTIONS.ADD_RECOMMENDATIONS, payload: recommendations });
  }, []);

  const clearRecommendations = useCallback(() => {
    dispatch({ type: APP_ACTIONS.CLEAR_RECOMMENDATIONS });
  }, []);

  // Filter management
  const toggleFilter = useCallback((filterType) => {
    console.log('🎛️ toggleFilter called for:', filterType);
    dispatch({ type: APP_ACTIONS.TOGGLE_FILTER, payload: filterType });
  }, []);

  const setFilter = useCallback((filterType, value) => {
    dispatch({ type: APP_ACTIONS.SET_FILTER, payload: { filterType, value } });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: APP_ACTIONS.RESET_FILTERS });
  }, []);

  const setAllFilters = useCallback((value) => {
    dispatch({ type: APP_ACTIONS.SET_ALL_FILTERS, payload: value });
  }, []);

  // Debug management
  const setDebugMode = useCallback((enabled) => {
    dispatch({ type: APP_ACTIONS.SET_DEBUG_MODE, payload: enabled });
  }, []);

  const toggleDebugMode = useCallback(() => {
    dispatch({ type: APP_ACTIONS.TOGGLE_DEBUG_MODE });
  }, []);

  const setLastAnalysis = useCallback((analysis) => {
    dispatch({ type: APP_ACTIONS.SET_LAST_ANALYSIS, payload: analysis });
  }, []);

  const toggleDebugPanel = useCallback(() => {
    dispatch({ type: APP_ACTIONS.TOGGLE_DEBUG_PANEL });
  }, []);

  // UI state management
  const setLoading = useCallback((isLoading) => {
    dispatch({ type: APP_ACTIONS.SET_LOADING, payload: isLoading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: APP_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: APP_ACTIONS.CLEAR_ERROR });
  }, []);

  // Session management
  const resetState = useCallback(() => {
    dispatch({ type: APP_ACTIONS.RESET_STATE });
  }, []);

  // Computed values
  const filteredRecommendations = state.recommendations.filter(rec => 
    state.activeFilters[rec.type] !== false
  );

  const hasActiveFilters = Object.values(state.activeFilters).some(active => active);

  const sessionDuration = state.sessionStartTime 
    ? Date.now() - state.sessionStartTime.getTime()
    : 0;

  const value = {
    // State
    ...state,
    
    // Computed values
    filteredRecommendations,
    hasActiveFilters,
    sessionDuration,
    
    // Message actions
    addMessage,
    updateMessage,
    clearMessages,
    
    // Input actions
    setCurrentInput,
    setProcessing,
    setLastUserInput,
    
    // Recommendation actions
    setRecommendations,
    addRecommendations,
    clearRecommendations,
    
    // Filter actions
    toggleFilter,
    setFilter,
    resetFilters,
    setAllFilters,
    
    // Debug actions
    setDebugMode,
    toggleDebugMode,
    setLastAnalysis,
    toggleDebugPanel,
    
    // UI actions
    setLoading,
    setError,
    clearError,
    
    // Session actions
    resetState
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export default AppStateContext;