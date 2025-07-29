import React from 'react';
import { motion } from 'framer-motion';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * OfflineMode component displays when the user is offline and provides
 * options to retry connectivity
 */
const OfflineMode = ({ 
  onRetry = null,
  showRetryButton = true,
  className = ''
}) => {
  const {
    isOnline,
    isConnectivityTesting,
    testConnectivity
  } = useNetworkStatus();

  const handleRetry = async () => {
    const result = await testConnectivity();
    if (onRetry) {
      onRetry(result);
    }
  };

  // Don't render if online
  if (isOnline) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        {/* Offline Icon */}
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            You're currently offline
          </h3>
          <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-300">
            Some features may not be available. Check your internet connection and try again.
          </p>

          {/* Offline Features Info */}
          <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
            <p>Available offline:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>View previous conversation history</li>
              <li>Browse cached recommendations</li>
              <li>Use basic app features</li>
            </ul>
          </div>

          {/* Retry Button */}
          {showRetryButton && (
            <div className="mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                disabled={isConnectivityTesting}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {isConnectivityTesting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </motion.div>
                    Testing connection...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try to reconnect
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default OfflineMode;