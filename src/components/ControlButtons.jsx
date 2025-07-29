import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@contexts/AppStateContext';
import { LoadingSpinner } from './ui';

const ControlButtons = ({ onTryAgain, onClearChat, className = '' }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const { 
    lastUserInput, 
    messages, 
    isProcessing, 
    isLoading 
  } = useAppState();

  // Check if we can retry (has last user input and not currently processing)
  const canRetry = lastUserInput && !isProcessing && !isLoading && !isRetrying;
  
  // Check if we can clear (has messages and not currently processing)
  const canClear = messages.length > 0 && !isProcessing && !isLoading;

  const handleTryAgain = useCallback(async () => {
    if (!canRetry || !onTryAgain) return;
    
    try {
      setIsRetrying(true);
      await onTryAgain();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [canRetry, onTryAgain]);

  const handleClearChat = useCallback(() => {
    if (!canClear) return;
    
    if (showClearConfirm) {
      // Confirm clear
      setShowClearConfirm(false);
      if (onClearChat) {
        onClearChat();
      }
    } else {
      // Show confirmation
      setShowClearConfirm(true);
    }
  }, [canClear, showClearConfirm, onClearChat]);

  const handleCancelClear = useCallback(() => {
    setShowClearConfirm(false);
  }, []);

  // Auto-hide confirmation after 5 seconds
  useEffect(() => {
    if (showClearConfirm) {
      const timer = setTimeout(() => {
        setShowClearConfirm(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showClearConfirm]);

  if (!canRetry && !canClear) {
    return null;
  }

  return (
    <motion.div 
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Try Again Button */}
      <AnimatePresence>
        {canRetry && (
          <motion.button
            onClick={handleTryAgain}
            disabled={isRetrying}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Try again with last input"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={!isRetrying ? { 
              scale: 1.05,
              backgroundColor: "rgb(249 250 251)",
              boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)"
            } : {}}
            whileTap={!isRetrying ? { scale: 0.95 } : {}}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {isRetrying ? (
                <motion.div
                  key="retrying"
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LoadingSpinner size="sm" color="text-gray-400" className="mr-2" />
                  <span>Retrying...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="try-again"
                  className="flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </motion.svg>
                  <span>Try Again</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Clear Chat Button */}
      <AnimatePresence>
        {canClear && (
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {!showClearConfirm ? (
                <motion.button
                  key="clear-button"
                  onClick={handleClearChat}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  aria-label="Clear chat history"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: "rgb(249 250 251)",
                    boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </motion.svg>
                  <span>Clear Chat</span>
                </motion.button>
              ) : (
                <motion.div 
                  key="confirm-buttons"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={handleClearChat}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                    aria-label="Confirm clear chat"
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: "#dc2626",
                      boxShadow: "0 4px 12px -2px rgba(220, 38, 38, 0.3)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.svg 
                      className="w-4 h-4 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M5 13l4 4L19 7" 
                      />
                    </motion.svg>
                    <span>Confirm</span>
                  </motion.button>
                  <motion.button
                    onClick={handleCancelClear}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                    aria-label="Cancel clear chat"
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: "rgb(249 250 251)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.svg 
                      className="w-4 h-4 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                      />
                    </motion.svg>
                    <span>Cancel</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ControlButtons;