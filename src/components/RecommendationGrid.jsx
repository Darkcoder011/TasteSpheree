import { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../contexts/AppStateContext';
import RecommendationCard from './RecommendationCard';
import RecommendationCardSkeleton from './skeletons/RecommendationCardSkeleton';
import RecommendationErrorBoundary from './RecommendationErrorBoundary';
import { useGridNavigation } from '../hooks/useAccessibility';

/**
 * RecommendationGrid component displays recommendations in a responsive grid layout
 * with smooth animations, loading states, and adaptive columns
 * Integrates with filtering system from AppStateContext
 */
const RecommendationGrid = memo(({ 
  recommendations: propRecommendations = null, // Allow override via props
  isLoading = false, 
  error = null,
  className = '',
  onRetry = null,
  showFiltered = true // Whether to apply active filters
}) => {
  const { filteredRecommendations, recommendations: contextRecommendations, activeFilters } = useAppState();
  const [animationDelay, setAnimationDelay] = useState(0);
  const [previousFilterState, setPreviousFilterState] = useState(activeFilters);
  
  // Determine which recommendations to use - memoized for performance
  const recommendations = useMemo(() => 
    propRecommendations !== null 
      ? propRecommendations 
      : (showFiltered ? filteredRecommendations : contextRecommendations),
    [propRecommendations, showFiltered, filteredRecommendations, contextRecommendations]
  );

  // Grid navigation hook
  const { gridRef, focusedIndex } = useGridNavigation(
    recommendations, 
    3, // columns
    (recommendation) => {
      // Handle recommendation selection if needed
      console.log('Selected recommendation:', recommendation);
    }
  );

  // Reset animation delay when recommendations change
  useEffect(() => {
    setAnimationDelay(0);
  }, [recommendations]);

  // Handle filter changes with smooth transitions
  useEffect(() => {
    const filtersChanged = JSON.stringify(activeFilters) !== JSON.stringify(previousFilterState);
    if (filtersChanged && showFiltered) {
      // Add a brief delay for smooth transition when filters change
      setAnimationDelay(50);
      setPreviousFilterState(activeFilters);
    }
  }, [activeFilters, previousFilterState, showFiltered]);



  // Memoized error state component
  const ErrorState = useMemo(() => (
    <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        {/* Error icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        
        {/* Error message */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load Recommendations
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || 'Something went wrong while fetching recommendations. Please try again.'}
        </p>
        
        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <span className="mr-2">🔄</span>
            Try Again
          </button>
        )}
      </div>
    </div>
  ), [error, onRetry]);

  // Memoized empty state component
  const EmptyState = useMemo(() => (
    <div className="col-span-full flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        {/* Empty icon */}
        <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">🔍</span>
        </div>
        
        {/* Empty message */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Recommendations Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn't find any recommendations based on your interests. Try describing different preferences or interests.
        </p>
      </div>
    </div>
  ), []);

  // Get grid columns class based on screen size and number of items - memoized
  const gridColumns = useMemo(() => {
    const itemCount = recommendations.length;
    
    if (itemCount === 0) return 'grid-cols-1';
    if (itemCount === 1) return 'grid-cols-1 md:grid-cols-1 lg:grid-cols-1';
    if (itemCount === 2) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    if (itemCount === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    
    // For 4+ items, use full responsive grid
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }, [recommendations.length]);

  // Generate loading skeletons - memoized
  const loadingSkeletons = useMemo(() => {
    const skeletonCount = 8; // Show 8 skeleton cards while loading
    return Array.from({ length: skeletonCount }, (_, index) => (
      <RecommendationCardSkeleton 
        key={`skeleton-${index}`} 
        index={index}
        className="h-full"
      />
    ));
  }, []);

  // Render recommendation cards with staggered animation - memoized
  const recommendationCards = useMemo(() => {
    return recommendations.map((recommendation, index) => (
      <motion.div
        key={recommendation.id || `rec-${index}`}
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ 
          duration: 0.5,
          delay: (index * 0.1) + (animationDelay / 1000),
          ease: "easeOut",
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        layout
        role="gridcell"
        aria-setsize={recommendations.length}
        aria-posinset={index + 1}
      >
        <RecommendationErrorBoundary>
          <RecommendationCard 
            recommendation={recommendation}
            className={`h-full ${focusedIndex === index ? 'ring-2 ring-blue-500' : ''}`}
          />
        </RecommendationErrorBoundary>
      </motion.div>
    ));
  }, [recommendations, animationDelay, focusedIndex]);

  return (
    <div className={`w-full ${className}`}>
      {/* Grid container */}
      <motion.div 
        ref={gridRef}
        className={`
          grid gap-6 
          ${gridColumns}
        `}
        layout
        transition={{ duration: 0.3, ease: "easeOut" }}
        role="grid"
        aria-label="Recommendations"
        tabIndex={0}
        id="recommendations"
      >
        {/* Loading state */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              className="contents"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {loadingSkeletons}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error state */}
        <AnimatePresence>
          {!isLoading && error && (
            <motion.div
              key="error"
              className="col-span-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <ErrorState />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Empty state */}
        <AnimatePresence>
          {!isLoading && !error && recommendations.length === 0 && (
            <motion.div
              key="empty"
              className="col-span-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {EmptyState}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Recommendations */}
        <AnimatePresence mode="popLayout">
          {!isLoading && !error && recommendations.length > 0 && recommendationCards}
        </AnimatePresence>
      </motion.div>

      {/* Grid info for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Showing {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} 
          {isLoading && ' (loading...)'}
        </div>
      )}
    </div>
  );
});

RecommendationGrid.displayName = 'RecommendationGrid';

export default RecommendationGrid;