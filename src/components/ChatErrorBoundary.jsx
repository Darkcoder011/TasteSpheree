import React from 'react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';

const ChatErrorFallback = (error, onRetry) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center p-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg m-4"
  >
    <div className="text-yellow-600 dark:text-yellow-400 mb-4">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7-4L5 20l.94-3.642C4.271 15.146 3 13.684 3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
      </svg>
    </div>
    
    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
      Chat Interface Error
    </h3>
    
    <p className="text-yellow-600 dark:text-yellow-300 text-center mb-4 max-w-md">
      The chat interface encountered an error. Your conversation history may be temporarily unavailable.
    </p>

    <div className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
      >
        Restart Chat
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          // Clear chat state and retry
          localStorage.removeItem('tastesphere-messages');
          onRetry();
        }}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
      >
        Clear & Restart
      </motion.button>
    </div>
  </motion.div>
);

const ChatErrorBoundary = ({ children, onError, onRetry }) => {
  return (
    <ErrorBoundary
      title="Chat Interface Error"
      message="The chat interface encountered an error. Your conversation history may be temporarily unavailable."
      fallback={ChatErrorFallback}
      onError={onError}
      onRetry={onRetry}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ChatErrorBoundary;