import { motion } from 'framer-motion';

/**
 * MessageSkeleton component provides loading skeleton for chat messages
 * with different layouts for user and AI messages
 */
const MessageSkeleton = ({ type = 'ai', className = '' }) => {
  const isUser = type === 'user';
  const isAI = type === 'ai';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut"
      }}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl`}>
        {/* Avatar skeleton */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
          isUser 
            ? 'bg-blue-200 dark:bg-blue-700' 
            : 'bg-gray-200 dark:bg-gray-600'
        } animate-shimmer`} />

        {/* Message content skeleton */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message bubble skeleton */}
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-blue-100 dark:bg-blue-800 rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-bl-md'
            } animate-shimmer`}
          >
            {/* Message lines skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-500 rounded w-24" />
            </div>
          </div>

          {/* Timestamp skeleton */}
          <div className={`mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-shimmer" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageSkeleton;