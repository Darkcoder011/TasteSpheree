import { motion } from 'framer-motion';

/**
 * InputBoxSkeleton component provides loading skeleton for input box
 * with button and input field skeletons
 */
const InputBoxSkeleton = ({ className = '' }) => {
  return (
    <motion.div 
      className={`flex items-center space-x-3 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Input field skeleton */}
      <div className="flex-1 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg animate-shimmer" />
      
      {/* Submit button skeleton */}
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg animate-shimmer" />
    </motion.div>
  );
};

export default InputBoxSkeleton;