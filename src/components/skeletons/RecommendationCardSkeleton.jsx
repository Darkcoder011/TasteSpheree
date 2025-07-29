import { motion } from 'framer-motion';

/**
 * RecommendationCardSkeleton component provides loading skeleton for recommendation cards
 * with shimmer animation and proper timing
 */
const RecommendationCardSkeleton = ({ index = 0, className = '' }) => {
  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-soft-dark border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
    >
      {/* Image skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-gray-600 animate-shimmer" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-3/4" />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-2/3" />
        </div>
        
        {/* Metadata skeleton */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-12" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-12" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-8" />
        </div>
        
        {/* Tags skeleton */}
        <div className="flex space-x-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-12" />
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-shimmer w-20" />
        </div>
      </div>
    </motion.div>
  );
};

export default RecommendationCardSkeleton;