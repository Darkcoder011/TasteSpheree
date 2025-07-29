import { useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { useLazyImage } from '../hooks/useLazyImage';
import { ariaLabels } from '../utils/accessibility';

/**
 * RecommendationCard component displays individual recommendations
 * with visually appealing cards, placeholder image handling, and hover effects
 */
const RecommendationCard = memo(({ recommendation, className = '' }) => {

  if (!recommendation) {
    return null;
  }

  const {
    id,
    name,
    type,
    score,
    metadata = {}
  } = recommendation;

  // Use lazy loading hook for better performance
  const {
    imgRef,
    isLoaded: imageLoaded,
    hasError: imageError,
    shouldLoad,
    handleLoad,
    handleError
  } = useLazyImage(metadata.imageUrl);

  // Memoized computed values for better performance
  const placeholderIcon = useMemo(() => {
    const placeholders = {
      movie: '🎬',
      tv_show: '📺',
      book: '📚',
      artist: '🎵',
      podcast: '🎙️',
      place: '📍',
      destination: '🌍',
      brand: '🏢',
      person: '👤'
    };
    return placeholders[type?.toLowerCase()] || '❓';
  }, [type]);

  const formattedEntityType = useMemo(() => {
    if (!type) return '';
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, [type]);

  const formattedScore = useMemo(() => {
    if (typeof score !== 'number') return '';
    return `${Math.round(score * 100)}%`;
  }, [score]);

  const hasImage = useMemo(() => 
    metadata.imageUrl && !imageError, 
    [metadata.imageUrl, imageError]
  );

  return (
    <motion.article
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl shadow-soft dark:shadow-soft-dark
        border border-gray-200 dark:border-gray-700
        cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900
        ${className}
      `}
      role="article"
      tabIndex={0}
      aria-label={ariaLabels.recommendationCard(recommendation)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Handle card selection if needed
        }
      }}
      whileHover={{ 
        scale: 1.03,
        y: -8,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        duration: 0.2,
        ease: "easeOut"
      }}
      layout
    >
      {/* Image Section */}
      <div ref={imgRef} className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {hasImage ? (
          <>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse" />
            )}
            
            {/* Actual image - only load when in view */}
            {shouldLoad && (
              <img
                src={metadata.imageUrl}
                alt={`${formattedEntityType} ${name}${metadata.description ? `: ${metadata.description}` : ''}`}
                className={`
                  w-full h-full object-cover transition-opacity duration-300
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={handleLoad}
                onError={handleError}
                loading="lazy"
              />
            )}
          </>
        ) : (
          /* Placeholder */
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl opacity-50">
              {placeholderIcon}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <motion.div 
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Score badge */}
        {score && (
          <motion.div 
            className="absolute top-3 right-3 bg-primary-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            whileHover={{ scale: 1.1 }}
          >
            {formattedScore}
          </motion.div>
        )}

        {/* Type badge */}
        <motion.div 
          className="absolute top-3 left-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-600"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
        >
          {formattedEntityType}
        </motion.div>
      </div>

      {/* Content Section */}
      <motion.div 
        className="p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Title */}
        <h3 
          className="font-semibold text-gray-900 dark:text-white text-lg leading-tight mb-2 line-clamp-2"
          id={`recommendation-title-${id}`}
        >
          {name}
        </h3>

        {/* Description */}
        {metadata.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3 line-clamp-3">
            {metadata.description}
          </p>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            {/* Year */}
            {metadata.year && (
              <span className="flex items-center">
                📅 {metadata.year}
              </span>
            )}

            {/* Rating */}
            {metadata.rating && (
              <span className="flex items-center">
                ⭐ {metadata.rating}
              </span>
            )}

            {/* Genre/Category */}
            {metadata.genre && (
              <span className="flex items-center">
                🏷️ {metadata.genre}
              </span>
            )}
          </div>

          {/* Source indicator */}
          <span className="text-primary-500 dark:text-primary-400 font-medium">
            Qloo
          </span>
        </div>

        {/* Tags */}
        {metadata.tags && metadata.tags.length > 0 && (
          <motion.div 
            className="mt-3 flex flex-wrap gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {metadata.tags.slice(0, 3).map((tag, index) => (
              <motion.span
                key={index}
                className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-md"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.5 + (index * 0.1),
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ scale: 1.05 }}
              >
                {tag}
              </motion.span>
            ))}
            {metadata.tags.length > 3 && (
              <motion.span 
                className="inline-block text-gray-500 dark:text-gray-400 text-xs px-2 py-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                +{metadata.tags.length - 3} more
              </motion.span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Interactive feedback indicator */}
      <motion.div 
        className="absolute inset-0 rounded-xl ring-2 ring-primary-500 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.5 }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  );
});

RecommendationCard.displayName = 'RecommendationCard';

export default RecommendationCard;