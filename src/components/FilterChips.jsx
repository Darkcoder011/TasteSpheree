import { useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../contexts/AppStateContext';
import { ENTITY_TYPES } from '../config/api';
import { useListNavigation, useAccessibility } from '../hooks/useAccessibility';
import { ariaLabels, announcements } from '../utils/accessibility';

/**
 * FilterChips component provides interactive filter chips for Qloo supported entity types
 * Allows users to toggle visibility of different recommendation types
 */
const FilterChips = memo(({ 
  className = '',
  showSelectAll = true,
  compact = false
}) => {
  const { activeFilters, toggleFilter, setAllFilters, recommendations } = useAppState();
  const { announce } = useAccessibility();
  
  // Memoized entity types
  const allEntityTypes = useMemo(() => Object.values(ENTITY_TYPES), []);
  
  // List navigation for keyboard support
  const { listRef } = useListNavigation(
    allEntityTypes,
    (entityType) => handleFilterToggle(entityType)
  );

  // Memoized handlers
  const handleFilterToggle = useCallback((entityType) => {
    console.log('🔘 Filter chip clicked:', entityType, 'Current state:', activeFilters[entityType]);
    const wasActive = activeFilters[entityType];
    toggleFilter(entityType);
    console.log('🔄 Filter toggled for:', entityType);
    
    // Announce filter change
    const displayName = entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const visibleCount = recommendations.filter(rec => 
      Object.entries(activeFilters).some(([type, active]) => 
        active && rec.type === type
      )
    ).length;
    
    announce(announcements.filterChange(displayName, !wasActive, visibleCount));
  }, [toggleFilter, activeFilters, recommendations, announce]);

  const handleSelectAll = useCallback(() => {
    const hasActiveFilters = Object.values(activeFilters).some(active => active);
    setAllFilters(!hasActiveFilters);
  }, [activeFilters, setAllFilters]);

  // Memoized display names and icons
  const displayNames = useMemo(() => ({
    [ENTITY_TYPES.PLACE]: 'Places',
    [ENTITY_TYPES.MOVIE]: 'Movies',
    [ENTITY_TYPES.BRAND]: 'Brands',
    [ENTITY_TYPES.PERSON]: 'People',
    [ENTITY_TYPES.TV_SHOW]: 'TV Shows',
    [ENTITY_TYPES.PODCAST]: 'Podcasts',
    [ENTITY_TYPES.BOOK]: 'Books',
    [ENTITY_TYPES.DESTINATION]: 'Destinations',
    [ENTITY_TYPES.ARTIST]: 'Artists'
  }), []);

  const icons = useMemo(() => ({
    [ENTITY_TYPES.PLACE]: '📍',
    [ENTITY_TYPES.MOVIE]: '🎬',
    [ENTITY_TYPES.BRAND]: '🏷️',
    [ENTITY_TYPES.PERSON]: '👤',
    [ENTITY_TYPES.TV_SHOW]: '📺',
    [ENTITY_TYPES.PODCAST]: '🎙️',
    [ENTITY_TYPES.BOOK]: '📚',
    [ENTITY_TYPES.DESTINATION]: '✈️',
    [ENTITY_TYPES.ARTIST]: '🎵'
  }), []);

  // Memoized recommendation counts
  const recommendationCounts = useMemo(() => {
    const counts = {};
    allEntityTypes.forEach(entityType => {
      counts[entityType] = recommendations.filter(rec => rec.type === entityType).length;
    });
    return counts;
  }, [recommendations, allEntityTypes]);

  // Memoized filter states
  const hasActiveFilters = useMemo(() => 
    Object.values(activeFilters).some(active => active), 
    [activeFilters]
  );
  
  const allFiltersActive = useMemo(() => 
    Object.values(activeFilters).every(active => active), 
    [activeFilters]
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Filter header with select all/none */}
      {showSelectAll && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Type
          </h3>
          <button
            onClick={handleSelectAll}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200"
          >
            {allFiltersActive ? 'Clear All' : 'Select All'}
          </button>
        </div>
      )}

      {/* Filter chips container */}
      <motion.div 
        ref={listRef}
        className={`
          flex flex-wrap gap-2 
          ${compact ? 'gap-1.5' : 'gap-2'}
        `}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, staggerChildren: 0.1 }}
        role="group"
        aria-label="Filter recommendations by type"
        id="filters"
      >
        {allEntityTypes.map((entityType) => {
          const isActive = activeFilters[entityType];
          const recommendationCount = recommendationCounts[entityType];
          const hasRecommendations = recommendationCount > 0;
          const displayName = displayNames[entityType] || entityType;
          const icon = icons[entityType] || '🔖';

          return (
            <motion.button
              key={entityType}
              onClick={() => handleFilterToggle(entityType)}
              disabled={!hasRecommendations}
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                transition-all duration-200 ease-out cursor-pointer select-none
                border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                dark:focus:ring-offset-gray-800
                ${isActive 
                  ? 'bg-primary-500 border-primary-500 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }
                ${!hasRecommendations ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={`${displayName} (${recommendationCount} recommendation${recommendationCount !== 1 ? 's' : ''})`}
              aria-label={ariaLabels.filterChip(entityType, isActive, recommendationCount)}
              role="switch"
              aria-checked={isActive}
              aria-describedby={`filter-help-${entityType}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={hasRecommendations ? { 
                scale: 1.05,
                y: -2,
                boxShadow: isActive 
                  ? "0 8px 25px -5px rgba(59, 130, 246, 0.3)" 
                  : "0 4px 12px -2px rgba(0, 0, 0, 0.1)"
              } : {}}
              whileTap={hasRecommendations ? { scale: 0.95 } : {}}
              transition={{ duration: 0.2 }}
            >
              {/* Icon */}
              <motion.span 
                className={`${compact ? 'mr-1' : 'mr-1.5'} text-base`}
                animate={{ 
                  rotate: isActive ? [0, 10, -10, 0] : 0,
                  scale: isActive ? 1.1 : 1
                }}
                transition={{ duration: 0.3 }}
              >
                {icon}
              </motion.span>
              
              {/* Label */}
              <span className={compact ? 'text-xs' : 'text-sm'}>
                {displayName}
              </span>
              
              {/* Count badge */}
              <AnimatePresence>
                {hasRecommendations && (
                  <motion.span 
                    className={`
                      ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium
                      ${isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }
                      ${compact ? 'text-xs px-1 py-0' : ''}
                    `}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {recommendationCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Filter status indicator */}
      {recommendations.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {hasActiveFilters ? (
            <>
              Showing {Object.values(activeFilters).filter(Boolean).length} of {allEntityTypes.length} types
              {!allFiltersActive && (
                <span className="ml-2 text-primary-600 dark:text-primary-400">
                  • {recommendations.filter(rec => activeFilters[rec.type]).length} recommendations visible
                </span>
              )}
            </>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">
              No filters active • All recommendations hidden
            </span>
          )}
        </div>
      )}

      {/* Empty state when no recommendations */}
      {recommendations.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Filters will appear when recommendations are available
          </p>
        </div>
      )}
    </div>
  );
});

FilterChips.displayName = 'FilterChips';

export default FilterChips;