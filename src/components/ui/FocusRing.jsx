import { motion } from 'framer-motion';

/**
 * FocusRing component provides accessible focus indicators
 * with smooth animations and proper contrast
 */
const FocusRing = ({ 
  children, 
  className = '',
  focusColor = 'ring-blue-500',
  disabled = false,
  ...props 
}) => {
  return (
    <motion.div
      className={`
        relative focus-within:ring-2 focus-within:ring-offset-2 
        ${focusColor} focus-within:ring-offset-white dark:focus-within:ring-offset-gray-800
        rounded-lg transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      whileFocus={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default FocusRing;