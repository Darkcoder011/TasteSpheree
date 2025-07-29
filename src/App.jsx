import { lazy, Suspense, memo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeProvider } from '@contexts/ThemeContext';
import { ApiProvider } from '@contexts/ApiContext';
import { AppStateProvider } from '@contexts/AppStateContext';
import { ThemeToggle } from '@components/ui';
import ErrorBoundary from '@components/ErrorBoundary';
import ChatErrorBoundary from '@components/ChatErrorBoundary';
import ApiErrorBoundary from '@components/ApiErrorBoundary';
import NetworkStatus from '@components/NetworkStatus';
import OfflineMode from '@components/OfflineMode';
import SkipLinks from '@components/SkipLinks';
import ScreenReader from '@components/ScreenReader';
import { AppSkeleton } from '@components/skeletons';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import { performanceMonitor } from '@utils/performance';

// Lazy load heavy components for better initial load performance
const ChatInterface = lazy(() => import('@components/ChatInterface'));
const DebugPanel = lazy(() => import('@components/DebugPanel'));

const App = memo(() => {
  const { handleBoundaryError } = useErrorHandler();
  const { isOnline } = useNetworkStatus();

  // Initialize performance monitoring
  useEffect(() => {
    performanceMonitor.startTiming('app-initialization');
    
    return () => {
      performanceMonitor.endTiming('app-initialization');
    };
  }, []);

  // Memoize error handlers to prevent unnecessary re-renders
  const handleAppError = useCallback((error, errorInfo) => {
    handleBoundaryError(error, errorInfo, 'App');
  }, [handleBoundaryError]);

  const handleChatError = useCallback((error, errorInfo) => {
    handleBoundaryError(error, errorInfo, 'ChatInterface');
  }, [handleBoundaryError]);

  const handleApiError = useCallback((error, errorInfo) => {
    handleBoundaryError(error, errorInfo, 'ApiProvider');
  }, [handleBoundaryError]);

  return (
    <ErrorBoundary
      title="Application Error"
      message="The application encountered an unexpected error. Please refresh the page to continue."
      onError={handleAppError}
    >
      <ThemeProvider>
        <ApiErrorBoundary onError={handleApiError}>
          <ApiProvider>
            <AppStateProvider>
              {/* Skip Links for keyboard navigation */}
              <SkipLinks />
              
              {/* Screen reader announcements */}
              <ScreenReader message={isOnline ? '' : 'Application is offline. Some features may be limited.'} />
              
              <motion.div
                className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Header */}
                <motion.header
                  role="banner"
                  className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                      <div className="flex items-center">
                        <motion.h1
                          className="text-xl font-bold text-gray-900 dark:text-white"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          TasteSphere
                        </motion.h1>
                      </div>
                      <nav role="navigation" aria-label="Main navigation">
                        <div className="flex items-center space-x-4">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                          >
                            <NetworkStatus showDetails={true} />
                          </motion.div>
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                          >
                            <ThemeToggle />
                          </motion.div>
                        </div>
                      </nav>
                    </div>
                  </div>
                </motion.header>

                {/* Main Content */}
                <motion.main
                  id="main-content"
                  role="main"
                  className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  {/* Chat Interface - Main Content Area */}
                  <section 
                    className="flex-1 flex flex-col min-h-0"
                    aria-label="Chat interface"
                  >
                    {/* Offline Mode Banner */}
                    {!isOnline && (
                      <div className="p-4" role="alert" aria-live="polite">
                        <OfflineMode />
                      </div>
                    )}

                    <ChatErrorBoundary onError={handleChatError}>
                      <Suspense fallback={<AppSkeleton />}>
                        <ChatInterface />
                      </Suspense>
                    </ChatErrorBoundary>
                  </section>

                  {/* Debug Panel */}
                  <aside 
                    className="lg:w-80"
                    aria-label="Debug panel"
                  >
                    <ErrorBoundary
                      title="Debug Panel Error"
                      message="The debug panel encountered an error but the main application continues to work."
                    >
                      <Suspense fallback={<div className="w-80 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
                        <DebugPanel />
                      </Suspense>
                    </ErrorBoundary>
                  </aside>
                </motion.main>
              </motion.div>
            </AppStateProvider>
          </ApiProvider>
        </ApiErrorBoundary>
      </ThemeProvider>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
