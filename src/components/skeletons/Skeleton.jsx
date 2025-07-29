import { motion } from 'framer-motion';

/**
 * Skeleton component provides a flexible loading skeleton
 * for various UI elements with customizable dimensions and animations
 */
const Skeleton = ({ 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded', 
  className = '',
  animate = true,
  delay = 0,
  children
}) => {
  const skeletonClasses = `
    bg-gray-200 dark:bg-gray-600 
    ${width} ${height} ${rounded} 
    ${animate ? 'animate-shimmer' : ''}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        className={skeletonClasses}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.3, 
          delay,
          ease: "easeOut"
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={skeletonClasses}>
      {children}
    </div>
  );
};

// Preset skeleton components for common use cases
export const SkeletonText = ({ lines = 1, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, index) => (
      <Skeleton
        key={index}
        height="h-4"
        width={index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}
        delay={index * 0.1}
        {...props}
      />
    ))}
  </div>
);

export const SkeletonCircle = ({ size = 'w-8 h-8', className = '', ...props }) => (
  <Skeleton
    width={size}
    height=""
    rounded="rounded-full"
    className={className}
    {...props}
  />
);

export const SkeletonButton = ({ className = '', ...props }) => (
  <Skeleton
    width="w-24"
    height="h-10"
    rounded="rounded-md"
    className={className}
    {...props}
  />
);

export const SkeletonCard = ({ className = '', ...props }) => (
  <motion.div
    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    {...props}
  >
    <Skeleton height="h-6" width="w-3/4" />
    <SkeletonText lines={2} />
    <div className="flex justify-between items-center">
      <Skeleton height="h-4" width="w-16" />
      <Skeleton height="h-4" width="w-12" />
    </div>
  </motion.div>
);

export default Skeleton;