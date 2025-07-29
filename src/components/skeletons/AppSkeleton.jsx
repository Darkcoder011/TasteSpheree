import { motion } from 'framer-motion';
import Skeleton, { SkeletonText, SkeletonButton } from './Skeleton';
import RecommendationCardSkeleton from './RecommendationCardSkeleton';
import MessageSkeleton from './MessageSkeleton';
import FilterChipsSkeleton from './FilterChipsSkeleton';
import InputBoxSkeleton from './InputBoxSkeleton';

/**
 * AppSkeleton component provides loading skeleton for the entire application
 * with proper layout and responsive design
 */
const AppSkeleton = ({ showRecommendations = true, showMessages = true }) => {
  return (
    <motion.div 
      className="min-h-screen bg-white dark:bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Skeleton */}
      <motion.header 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Skeleton width="w-32" height="h-6" />
            <div className="flex items-center space-x-4">
              <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
              <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Skeleton */}
      <motion.main 
        className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Chat Interface Skeleton */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col h-screen max-h-screen">
            {/* Messages Container Skeleton */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50 dark:bg-gray-900">
              {showMessages ? (
                <div className="max-w-4xl mx-auto w-full space-y-4">
                  <MessageSkeleton type="user" />
                  <MessageSkeleton type="ai" />
                  <MessageSkeleton type="user" />
                  
                  {/* Recommendations Section Skeleton */}
                  {showRecommendations && (
                    <motion.div
                      className="mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      {/* Filter Header Skeleton */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton width="w-48" height="h-6" />
                          <Skeleton width="w-24" height="h-4" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <Skeleton width="w-32" height="h-4" />
                          <Skeleton width="w-28" height="h-4" />
                        </div>
                      </div>

                      {/* Filter Chips Skeleton */}
                      <FilterChipsSkeleton count={8} className="mb-6" />

                      {/* Recommendation Grid Skeleton */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }, (_, index) => (
                          <RecommendationCardSkeleton 
                            key={index} 
                            index={index}
                            className="h-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                // Welcome Screen Skeleton
                <motion.div 
                  className="flex flex-col items-center justify-center h-full text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="max-w-md mx-auto space-y-4">
                    <Skeleton width="w-64" height="h-8" className="mx-auto" />
                    <SkeletonText lines={2} className="mx-auto max-w-sm" />
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <Skeleton width="w-32" height="h-4" className="mx-auto mb-2" />
                      <Skeleton width="w-48" height="h-4" className="mx-auto" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area Skeleton */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="max-w-4xl mx-auto px-4 py-4">
                {/* Control buttons skeleton */}
                <div className="mb-3 flex items-center gap-2">
                  <SkeletonButton />
                  <SkeletonButton />
                </div>
                
                <InputBoxSkeleton />
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel Skeleton */}
        <motion.div 
          className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton width="w-24" height="h-6" />
              <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
            </div>
            
            <div className="space-y-3">
              <Skeleton width="w-full" height="h-4" />
              <Skeleton width="w-3/4" height="h-4" />
              <Skeleton width="w-1/2" height="h-4" />
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <Skeleton width="w-32" height="h-5" className="mb-3" />
              <div className="space-y-2">
                <Skeleton width="w-full" height="h-3" />
                <Skeleton width="w-5/6" height="h-3" />
                <Skeleton width="w-4/5" height="h-3" />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </motion.div>
  );
};

export default AppSkeleton;