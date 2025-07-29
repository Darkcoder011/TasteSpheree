import React from 'react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';

const RecommendationErrorFallback = ({ error, onRetry }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg m-4"
  >
    <div className="text-blue-600 dark:text-blue-400 mb-4">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    </div>
    
    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
      Recommendations Error
    </h3>
    
    <p className="text-blue-600 dark:text-blue-300 text-center mb-4 max-w-md">
      Unable to display recommendations. This might be due to a display issue or data processing error.
    </p>

    <div className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Reload Recommendations
      </motion.button>
    </div>
  </motion.div>
);

const RecommendationErrorBoundary = ({ children, onError, onRetry }) => {
  return (
    <ErrorBoundary
      title="Recommendations Error"
      message="Unable to display recommendations. This might be due to a display issue or data processing error."
      fallback={RecommendationErrorFallback}
      onError={onError}
      onRetry={onRetry}
    >
      {children}
    </ErrorBoundary>
  );
};

export default RecommendationErrorBoundary;