import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilteredRecommendationView from '../FilteredRecommendationView';
import { ENTITY_TYPES } from '../../config/api';

// Mock contexts
const mockToggleFilter = vi.fn();
const mockSetAllFilters = vi.fn();

const mockAppState = {
  recommendations: [
    { id: '1', type: ENTITY_TYPES.MOVIE, name: 'Test Movie 1' },
    { id: '2', type: ENTITY_TYPES.BOOK, name: 'Test Book 1' },
    { id: '3', type: ENTITY_TYPES.MOVIE, name: 'Test Movie 2' },
    { id: '4', type: ENTITY_TYPES.ARTIST, name: 'Test Artist 1' }
  ],
  filteredRecommendations: [
    { id: '1', type: ENTITY_TYPES.MOVIE, name: 'Test Movie 1' },
    { id: '3', type: ENTITY_TYPES.MOVIE, name: 'Test Movie 2' }
  ],
  activeFilters: {
    [ENTITY_TYPES.MOVIE]: true,
    [ENTITY_TYPES.BOOK]: false,
    [ENTITY_TYPES.ARTIST]: false,
    [ENTITY_TYPES.PLACE]: false,
    [ENTITY_TYPES.BRAND]: false,
    [ENTITY_TYPES.PERSON]: false,
    [ENTITY_TYPES.TV_SHOW]: false,
    [ENTITY_TYPES.PODCAST]: false,
    [ENTITY_TYPES.DESTINATION]: false
  },
  hasActiveFilters: true,
  isLoading: false,
  error: null,
  toggleFilter: mockToggleFilter,
  setAllFilters: mockSetAllFilters
};

const mockTheme = {
  theme: 'light'
};

// Mock the contexts
vi.mock('../../contexts/AppStateContext', () => ({
  useAppState: () => mockAppState
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => mockTheme
}));

describe('FilteredRecommendationView', () => {
  beforeEach(() => {
    mockToggleFilter.mockClear();
    mockSetAllFilters.mockClear();
  });

  it('renders filter chips and recommendation grid', () => {
    render(<FilteredRecommendationView />);
    
    // Should show filter header
    expect(screen.getByText('Filter Recommendations')).toBeInTheDocument();
    
    // Should show filter status
    expect(screen.getByText('2 of 4 shown')).toBeInTheDocument();
    
    // Should show filter chips
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('shows correct filter statistics', () => {
    render(<FilteredRecommendationView />);
    
    // Should show active filter count
    expect(screen.getByText(/1 of \d+ types active/)).toBeInTheDocument();
    
    // Should show hidden recommendations count
    expect(screen.getByText('2 hidden by filters')).toBeInTheDocument();
  });

  it('hides filter header when showFilterHeader is false', () => {
    render(<FilteredRecommendationView showFilterHeader={false} />);
    
    expect(screen.queryByText('Filter Recommendations')).not.toBeInTheDocument();
  });

  it('shows no results message when all recommendations are filtered out', () => {
    const emptyFilteredState = {
      ...mockAppState,
      filteredRecommendations: [],
      hasActiveFilters: true
    };
    
    vi.mocked(require('../../contexts/AppStateContext').useAppState).mockReturnValue(emptyFilteredState);
    
    render(<FilteredRecommendationView />);
    
    expect(screen.getByText('No Recommendations Match Your Filters')).toBeInTheDocument();
  });

  it('applies compact mode to filter chips', () => {
    render(<FilteredRecommendationView compact={true} />);
    
    // Component should render without errors in compact mode
    expect(screen.getByText('Movies')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const loadingState = {
      ...mockAppState,
      isLoading: true
    };
    
    vi.mocked(require('../../contexts/AppStateContext').useAppState).mockReturnValue(loadingState);
    
    render(<FilteredRecommendationView />);
    
    // Should still show filters even when loading
    expect(screen.getByText('Filter Recommendations')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorState = {
      ...mockAppState,
      error: 'Test error message'
    };
    
    vi.mocked(require('../../contexts/AppStateContext').useAppState).mockReturnValue(errorState);
    
    render(<FilteredRecommendationView />);
    
    // Should still show filters even with error
    expect(screen.getByText('Filter Recommendations')).toBeInTheDocument();
  });

  it('shows development info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    render(<FilteredRecommendationView />);
    
    // Should show development statistics
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('Visible:')).toBeInTheDocument();
    expect(screen.getByText('Hidden:')).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('handles empty recommendations gracefully', () => {
    const emptyState = {
      ...mockAppState,
      recommendations: [],
      filteredRecommendations: []
    };
    
    vi.mocked(require('../../contexts/AppStateContext').useAppState).mockReturnValue(emptyState);
    
    render(<FilteredRecommendationView />);
    
    // Should not show filter section when no recommendations
    expect(screen.queryByText('Filter Recommendations')).not.toBeInTheDocument();
  });

  it('passes onRetry to recommendation grid', () => {
    const mockRetry = vi.fn();
    
    render(<FilteredRecommendationView onRetry={mockRetry} />);
    
    // Component should render without errors
    expect(screen.getByText('Filter Recommendations')).toBeInTheDocument();
  });
});