import { motion } from 'framer-motion';

/**
 * FilterChipsSkeleton component provides loading skeleton for filter chips
 * with staggered animation
 */
const FilterChipsSkeleton = ({ count = 6, className = '' }) => {
  return (
    <motion.div 
      className={`flex flex-wrap gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: count }, (_, index) => (
        <motion.div
          key={index}
          className="h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-shimmer"
          style={{ width: `${60 + Math.random() * 40}px` }} // Random width between 60-100px
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.3, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
        />
      ))}
    </motion.div>
  );
};

export default FilterChipsSkeleton;