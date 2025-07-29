import React from 'react';
import { motion } from 'framer-motion';
import ErrorBoundary from './ErrorBoundary';

const ApiErrorFallback = (error, onRetry) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg m-4"
  >
    <div className="text-orange-600 dark:text-orange-400 mb-4">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </div>
    
    <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
      API Service Error
    </h3>
    
    <p className="text-orange-600 dark:text-orange-300 text-center mb-4 max-w-md">
      There was an error with the API services. This might affect recommendations and entity processing.
    </p>

    <div className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRetry}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
      >
        Retry API Connection
      </motion.button>
    </div>
  </motion.div>
);

const ApiErrorBoundary = ({ children, onError, onRetry }) => {
  return (
    <ErrorBoundary
      title="API Service Error"
      message="There was an error with the API services. This might affect recommendations and entity processing."
      fallback={ApiErrorFallback}
      onError={onError}
      onRetry={onRetry}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ApiErrorBoundary;