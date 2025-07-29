// Test component to verify context providers are working
import React, { createContext, useContext } from 'react';

import { TasteSphereProviders, useApi, useAppState, useTheme } from './contexts';

// Mock context for testing
const MockAppStateContext = createContext();

export const TestContextProvider = ({ children, appState = {}, theme = {}, api = {} }) => {
  const mockAppStateValue = {
    // Default mock values
    messages: [],
    lastUserInput: '',
    isProcessing: false,
    isLoading: false,
    debugMode: false,
    activeFilters: {},
    recommendations: [],
    error: null,
    // Allow overrides
    ...appState
  };

  const mockThemeValue = {
    theme: 'light',
    toggleTheme: () => {},
    ...theme
  };

  const mockApiValue = {
    isLoading: false,
    config: {
      qloo: { baseUrl: 'https://test.api.com' }
    },
    ...api
  };

  return (
    <MockAppStateContext.Provider value={mockAppStateValue}>
      {children}
    </MockAppStateContext.Provider>
  );
};

// Hook to use mock context in tests
export const useMockAppState = () => {
  const context = useContext(MockAppStateContext);
  if (!context) {
    throw new Error('useMockAppState must be used within TestContextProvider');
  }
  return context;
};

const TestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const { isLoading, config } = useApi();
  const { debugMode, toggleDebugMode, sessionId } = useAppState();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Context Test</h2>
      
      <div className="space-y-2">
        <p>Theme: {theme}</p>
        <button 
          onClick={toggleTheme}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Toggle Theme
        </button>
      </div>

      <div className="space-y-2">
        <p>API Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Qloo Base URL: {config.qloo.baseUrl}</p>
      </div>

      <div className="space-y-2">
        <p>Debug Mode: {debugMode ? 'On' : 'Off'}</p>
        <p>Session ID: {sessionId}</p>
        <button 
          onClick={toggleDebugMode}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Toggle Debug
        </button>
      </div>
    </div>
  );
};

const TestApp = () => (
  <TasteSphereProviders>
    <TestComponent />
  </TasteSphereProviders>
);

export default TestApp;