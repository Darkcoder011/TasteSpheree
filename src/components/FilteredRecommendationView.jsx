import { useState, useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useTheme } from '../contexts/ThemeContext';
import FilterChips from './FilterChips';
import RecommendationGrid from './RecommendationGrid';
import { FilterChipsSkeleton } from './skeletons';

/**
 * FilteredRecommendationView combines FilterChips and RecommendationGrid
 * Provides a complete filtering experience with smooth transitions
 */
const FilteredRecommendationView = ({
  className = '',
  showFilterHeader = true,
  compact = false,
  gridClassName = '',
  onRetry = null
}) => {
  const { 
    recommendations, 
    filteredRecommendations, 
    activeFilters, 
    hasActiveFilters,
    isLoading,
    error 
  } = useAppState();
  const { theme } = useTheme();
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousFilteredCount, setPreviousFilteredCount] = useState(0);

  // Handle smooth transitions when filters change
  useEffect(() => {
    const currentFilteredCount = filteredRecommendations.length;
    
    if (currentFilteredCount !== previousFilteredCount && recommendations.length > 0) {
      setIsTransitioning(true);
      
      // Reset transition state after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousFilteredCount(currentFilteredCount);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [filteredRecommendations.length, previousFilteredCount, recommendations.length]);

  // Get filter statistics
  const totalRecommendations = recommendations.length;
  const visibleRecommendations = filteredRecommendations.length;
  const hiddenRecommendations = totalRecommendations - visibleRecommendations;
  
  // Get active filter count
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;
  const totalFilterCount = Object.keys(activeFilters).length;

  // Check if all filters are disabled
  const allFiltersDisabled = !hasActiveFilters;

  return (
    <div className={`w-full ${className}`}>
      {/* Filter Section */}
      {totalRecommendations > 0 && (
        <div className="mb-6">
          {/* Filter Header */}
          {showFilterHeader && (
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filter Recommendations
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {visibleRecommendations} of {totalRecommendations} shown
                </div>
              </div>
              
              {/* Filter Status */}
              <div className="mt-2 flex items-center space-x-4 text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {activeFilterCount} of {totalFilterCount} types active
                </span>
                
                {hiddenRecommendations > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {hiddenRecommendations} hidden by filters
                  </span>
                )}
                
                {allFiltersDisabled && (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    All recommendations hidden
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Filter Chips */}
          <div className={`
            transition-all duration-300 ease-out
            ${isTransitioning ? 'opacity-75 scale-98' : 'opacity-100 scale-100'}
          `}>
            {isLoading ? (
              <FilterChipsSkeleton count={6} className="mb-4" />
            ) : (
              <FilterChips 
                compact={compact}
                showSelectAll={true}
                className="mb-4"
              />
            )}
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      <div className={`
        transition-all duration-300 ease-out
        ${isTransitioning ? 'opacity-75 transform scale-98' : 'opacity-100 transform scale-100'}
      `}>
        <RecommendationGrid
          recommendations={filteredRecommendations}
          isLoading={isLoading}
          error={error}
          className={gridClassName}
          onRetry={onRetry}
          showFiltered={false} // We're already passing filtered recommendations
        />
      </div>

      {/* No Results Message */}
      {totalRecommendations > 0 && visibleRecommendations === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Recommendations Match Your Filters
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try enabling more filter types to see recommendations, or clear all filters to see everything.
            </p>
            <div className="space-y-2">
              <FilterChips 
                compact={true}
                showSelectAll={true}
                className="justify-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* Filter Performance Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && totalRecommendations > 0 && (
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-500 dark:text-gray-400">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Total:</span> {totalRecommendations}
            </div>
            <div>
              <span className="font-medium">Visible:</span> {visibleRecommendations}
            </div>
            <div>
              <span className="font-medium">Hidden:</span> {hiddenRecommendations}
            </div>
            <div>
              <span className="font-medium">Filters:</span> {activeFilterCount}/{totalFilterCount}
            </div>
          </div>
          {isTransitioning && (
            <div className="mt-2 text-blue-600 dark:text-blue-400">
              ⚡ Transitioning...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilteredRecommendationView;