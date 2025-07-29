import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FilteredRecommendationView from './FilteredRecommendationView';

const MessageBubble = memo(({ 
  message, 
  type, 
  timestamp, 
  isLoading, 
  status, 
  recommendations, 
  onRetry 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Animate message appearance
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Memoized computed values
  const formattedTimestamp = useMemo(() => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [timestamp]);

  const isUser = useMemo(() => type === 'user', [type]);
  const isAI = useMemo(() => type === 'ai', [type]);
  const hasRecommendations = useMemo(() => recommendations && recommendations.length > 0, [recommendations]);
  const isError = useMemo(() => status === 'error', [status]);
  const isProcessing = useMemo(() => 
    status === 'processing' || status === 'analyzing' || status === 'fetching', 
    [status]
  );

  // Memoized retry handler
  const handleRetry = useCallback(() => {
    if (onRetry) onRetry();
  }, [onRetry]);

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ y: 20, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
    >
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 ${
        hasRecommendations && !isLoading 
          ? 'max-w-full' 
          : 'max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl'
      }`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
        } transition-colors duration-300`}>
          {isUser ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <motion.div
            className={`relative px-4 py-3 rounded-2xl shadow-sm ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
            }`}
            whileHover={{ 
              scale: 1.02, 
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Loading indicator for sending messages */}
            {isLoading && isUser && (
              <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            )}

            {/* Loading indicator for AI processing */}
            <AnimatePresence>
              {isLoading && isAI && (
                <motion.div 
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((index) => (
                      <motion.div
                        key={index}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{
                          y: [0, -8, 0],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: index * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                  <motion.span 
                    className="text-sm text-gray-500 dark:text-gray-400"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {status === 'analyzing' ? 'Analyzing...' : 
                     status === 'fetching' ? 'Finding recommendations...' : 
                     'Processing...'}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message text */}
            <AnimatePresence>
              {!isLoading && (
                <motion.p 
                  className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  {message.content}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Message status indicator for user messages */}
            {isUser && !isLoading && (
              <div className="absolute -right-1 -bottom-1">
                {status === 'sent' && (
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                )}
                {status === 'error' && (
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                )}
              </div>
            )}

            {/* Error indicator for AI messages */}
            {isAI && isError && (
              <div className="absolute -left-1 -bottom-1">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              </div>
            )}
          </motion.div>

          {/* Retry button for error messages */}
          {isError && onRetry && (
            <div className={`mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
              <button
                onClick={handleRetry}
                className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Recommendations display */}
          <AnimatePresence>
            {hasRecommendations && !isLoading && (
              <motion.div 
                className="mt-4 w-full max-w-4xl"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.3,
                  ease: "easeOut"
                }}
              >
                <FilteredRecommendationView 
                  showFilterHeader={true}
                  compact={false}
                  onRetry={handleRetry}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timestamp */}
          <div className={`mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formattedTimestamp}
              {status === 'error' && (
                <span className="ml-1 text-red-500">
                  {isUser ? 'Failed to send' : 'Processing failed'}
                </span>
              )}
              {isProcessing && (
                <span className="ml-1 text-blue-500">Processing...</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;