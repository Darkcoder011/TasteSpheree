import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterChips from '../FilterChips';
import { ENTITY_TYPES } from '../../config/api';

// Mock contexts
const mockToggleFilter = vi.fn();
const mockSetAllFilters = vi.fn();

const mockAppState = {
  activeFilters: {
    [ENTITY_TYPES.MOVIE]: true,
    [ENTITY_TYPES.BOOK]: true,
    [ENTITY_TYPES.ARTIST]: false,
    [ENTITY_TYPES.PLACE]: true,
    [ENTITY_TYPES.BRAND]: false,
    [ENTITY_TYPES.PERSON]: false,
    [ENTITY_TYPES.TV_SHOW]: false,
    [ENTITY_TYPES.PODCAST]: false,
    [ENTITY_TYPES.DESTINATION]: false
  },
  recommendations: [
    { id: '1', type: ENTITY_TYPES.MOVIE, name: 'Test Movie' },
    { id: '2', type: ENTITY_TYPES.BOOK, name: 'Test Book' },
    { id: '3', type: ENTITY_TYPES.MOVIE, name: 'Another Movie' },
    { id: '4', type: ENTITY_TYPES.ARTIST, name: 'Test Artist' }
  ],
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

describe('FilterChips', () => {
  beforeEach(() => {
    mockToggleFilter.mockClear();
    mockSetAllFilters.mockClear();
  });

  it('renders filter chips for all entity types', () => {
    render(<FilterChips />);
    
    // Check that all entity types are rendered
    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
    expect(screen.getByText('Places')).toBeInTheDocument();
    expect(screen.getByText('Brands')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('TV Shows')).toBeInTheDocument();
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
    expect(screen.getByText('Destinations')).toBeInTheDocument();
  });

  it('displays correct recommendation counts', () => {
    render(<FilterChips />);
    
    // Movies should show count of 2
    const movieChip = screen.getByText('Movies').closest('button');
    expect(movieChip).toHaveTextContent('2');
    
    // Books should show count of 1
    const bookChip = screen.getByText('Books').closest('button');
    expect(bookChip).toHaveTextContent('1');
    
    // Artists should show count of 1
    const artistChip = screen.getByText('Artists').closest('button');
    expect(artistChip).toHaveTextContent('1');
  });

  it('shows active state for enabled filters', () => {
    render(<FilterChips />);
    
    const movieChip = screen.getByText('Movies').closest('button');
    const artistChip = screen.getByText('Artists').closest('button');
    
    // Movie filter is active, should have primary background
    expect(movieChip).toHaveClass('bg-primary-500');
    
    // Artist filter is inactive, should have white/gray background
    expect(artistChip).toHaveClass('bg-white');
  });

  it('disables chips for entity types with no recommendations', () => {
    render(<FilterChips />);
    
    // Brands, People, TV Shows, Podcasts, Destinations have no recommendations
    const brandsChip = screen.getByText('Brands').closest('button');
    const peopleChip = screen.getByText('People').closest('button');
    
    expect(brandsChip).toBeDisabled();
    expect(peopleChip).toBeDisabled();
    expect(brandsChip).toHaveClass('opacity-50');
  });

  it('calls toggleFilter when chip is clicked', async () => {
    render(<FilterChips />);
    
    const movieChip = screen.getByText('Movies').closest('button');
    fireEvent.click(movieChip);
    
    // Should call toggleFilter after animation delay
    await waitFor(() => {
      expect(mockToggleFilter).toHaveBeenCalledWith(ENTITY_TYPES.MOVIE);
    }, { timeout: 200 });
  });

  it('handles select all/clear all functionality', () => {
    render(<FilterChips />);
    
    const selectAllButton = screen.getByText('Clear All'); // Should show "Clear All" since some filters are active
    fireEvent.click(selectAllButton);
    
    expect(mockSetAllFilters).toHaveBeenCalledWith(false);
  });

  it('shows correct filter status', () => {
    render(<FilterChips />);
    
    // Should show active filter count
    expect(screen.getByText(/Showing \d+ of \d+ types/)).toBeInTheDocument();
  });

  it('renders with compact mode', () => {
    render(<FilterChips compact={true} />);
    
    const movieChip = screen.getByText('Movies').closest('button');
    expect(movieChip.querySelector('span')).toHaveClass('text-xs');
  });

  it('hides select all when showSelectAll is false', () => {
    render(<FilterChips showSelectAll={false} />);
    
    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    expect(screen.queryByText('Select All')).not.toBeInTheDocument();
  });

  it('includes proper accessibility attributes', () => {
    render(<FilterChips />);
    
    const movieChip = screen.getByText('Movies').closest('button');
    
    expect(movieChip).toHaveAttribute('role', 'switch');
    expect(movieChip).toHaveAttribute('aria-checked', 'true');
    expect(movieChip).toHaveAttribute('aria-label', 'Toggle Movies filter');
  });

  it('shows correct icons for each entity type', () => {
    render(<FilterChips />);
    
    // Check that icons are present (emojis)
    expect(screen.getByText('🎬')).toBeInTheDocument(); // Movies
    expect(screen.getByText('📚')).toBeInTheDocument(); // Books
    expect(screen.getByText('🎵')).toBeInTheDocument(); // Artists
    expect(screen.getByText('📍')).toBeInTheDocument(); // Places
  });

  it('shows tooltip with recommendation count', () => {
    render(<FilterChips />);
    
    const movieChip = screen.getByText('Movies').closest('button');
    expect(movieChip).toHaveAttribute('title', 'Movies (2 recommendations)');
    
    const bookChip = screen.getByText('Books').closest('button');
    expect(bookChip).toHaveAttribute('title', 'Books (1 recommendation)');
  });
});