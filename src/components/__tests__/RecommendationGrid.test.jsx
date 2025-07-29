import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecommendationGrid from '../RecommendationGrid.jsx';
import { ThemeProvider } from '@contexts/ThemeContext.jsx';

// Mock RecommendationCard component
vi.mock('../RecommendationCard.jsx', () => ({
  default: ({ recommendation, className }) => (
    <div data-testid={`recommendation-card-${recommendation.id}`} className={className}>
      {recommendation.name}
    </div>
  )
}));

// Mock recommendations data
const mockRecommendations = [
  {
    id: 'rec-1',
    name: 'The Matrix',
    type: 'movie',
    score: 0.85,
    metadata: { description: 'A sci-fi movie' }
  },
  {
    id: 'rec-2',
    name: 'Inception',
    type: 'movie',
    score: 0.92,
    metadata: { description: 'A mind-bending thriller' }
  },
  {
    id: 'rec-3',
    name: 'Dune',
    type: 'book',
    score: 0.78,
    metadata: { description: 'A sci-fi epic' }
  }
];

// Test wrapper with theme provider
const TestWrapper = ({ children, theme = 'light' }) => (
  <ThemeProvider>
    <div className={theme}>
      {children}
    </div>
  </ThemeProvider>
);

describe('RecommendationGrid', () => {
  it('renders recommendations in grid layout', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={mockRecommendations} />
      </TestWrapper>
    );

    // Check that all recommendations are rendered
    expect(screen.getByTestId('recommendation-card-rec-1')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-card-rec-2')).toBeInTheDocument();
    expect(screen.getByTestId('recommendation-card-rec-3')).toBeInTheDocument();

    // Check recommendation content
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={[]} isLoading={true} />
      </TestWrapper>
    );

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when error occurs', () => {
    const errorMessage = 'Failed to fetch recommendations';
    render(
      <TestWrapper>
        <RecommendationGrid 
          recommendations={[]} 
          error={errorMessage}
          onRetry={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Unable to Load Recommendations')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockRetry = vi.fn();
    render(
      <TestWrapper>
        <RecommendationGrid 
          recommendations={[]} 
          error="Test error"
          onRetry={mockRetry}
        />
      </TestWrapper>
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no recommendations and not loading', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('No Recommendations Found')).toBeInTheDocument();
    expect(screen.getByText(/couldn't find any recommendations/)).toBeInTheDocument();
  });

  it('applies correct grid columns for different item counts', () => {
    // Test with 1 item
    const { rerender } = render(
      <TestWrapper>
        <RecommendationGrid recommendations={[mockRecommendations[0]]} />
      </TestWrapper>
    );

    let gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-1', 'lg:grid-cols-1');

    // Test with 2 items
    rerender(
      <TestWrapper>
        <RecommendationGrid recommendations={mockRecommendations.slice(0, 2)} />
      </TestWrapper>
    );

    gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-2');

    // Test with 3 items
    rerender(
      <TestWrapper>
        <RecommendationGrid recommendations={mockRecommendations} />
      </TestWrapper>
    );

    gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');

    // Test with 4+ items
    const manyRecommendations = [
      ...mockRecommendations,
      { id: 'rec-4', name: 'Test 4', type: 'movie', score: 0.8, metadata: {} }
    ];

    rerender(
      <TestWrapper>
        <RecommendationGrid recommendations={manyRecommendations} />
      </TestWrapper>
    );

    gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <RecommendationGrid 
          recommendations={mockRecommendations} 
          className="custom-grid-class"
        />
      </TestWrapper>
    );

    expect(container.firstChild.firstChild).toHaveClass('custom-grid-class');
  });

  it('supports dark mode styling', () => {
    render(
      <TestWrapper theme="dark">
        <RecommendationGrid recommendations={[]} error="Test error" />
      </TestWrapper>
    );

    // Check that dark mode classes are applied to error state
    const errorContainer = screen.getByText('Unable to Load Recommendations').closest('div');
    expect(errorContainer.querySelector('.dark\\:bg-red-900\\/20')).toBeInTheDocument();
  });

  it('shows staggered animations for recommendations', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={mockRecommendations} />
      </TestWrapper>
    );

    const animatedElements = document.querySelectorAll('.animate-fade-in');
    expect(animatedElements).toHaveLength(mockRecommendations.length);

    // Check that each element has different animation delay
    animatedElements.forEach((element, index) => {
      expect(element.style.animationDelay).toBe(`${index * 100}ms`);
    });
  });

  it('shows development info in development mode', () => {
    // Mock NODE_ENV
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <TestWrapper>
        <RecommendationGrid recommendations={mockRecommendations} />
      </TestWrapper>
    );

    expect(screen.getByText('Showing 3 recommendations')).toBeInTheDocument();

    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('handles recommendations without IDs', () => {
    const recommendationsWithoutIds = [
      { name: 'Test 1', type: 'movie', score: 0.8, metadata: {} },
      { name: 'Test 2', type: 'book', score: 0.7, metadata: {} }
    ];

    render(
      <TestWrapper>
        <RecommendationGrid recommendations={recommendationsWithoutIds} />
      </TestWrapper>
    );

    // Should still render without crashing
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
  });

  it('applies h-full class to recommendation cards', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={[mockRecommendations[0]]} />
      </TestWrapper>
    );

    const card = screen.getByTestId('recommendation-card-rec-1');
    expect(card).toHaveClass('h-full');
  });

  it('shows correct loading skeleton count', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={[]} isLoading={true} />
      </TestWrapper>
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons).toHaveLength(8); // Should show 8 skeleton cards
  });

  it('handles empty recommendations array', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={[]} />
      </TestWrapper>
    );

    expect(screen.getByText('No Recommendations Found')).toBeInTheDocument();
  });

  it('does not show retry button when onRetry is not provided', () => {
    render(
      <TestWrapper>
        <RecommendationGrid 
          recommendations={[]} 
          error="Test error"
        />
      </TestWrapper>
    );

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('applies smooth transitions to grid container', () => {
    render(
      <TestWrapper>
        <RecommendationGrid recommendations={mockRecommendations} />
      </TestWrapper>
    );

    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass('transition-all', 'duration-300', 'ease-out');
  });
});