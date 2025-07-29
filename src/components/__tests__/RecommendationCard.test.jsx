import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecommendationCard from '../RecommendationCard.jsx';
import { ThemeProvider } from '@contexts/ThemeContext.jsx';

// Mock recommendation data
const mockRecommendation = {
  id: 'test-1',
  name: 'The Matrix',
  type: 'movie',
  score: 0.85,
  metadata: {
    description: 'A computer programmer discovers reality is a simulation.',
    imageUrl: 'https://example.com/matrix.jpg',
    year: 1999,
    rating: 8.7,
    genre: 'Sci-Fi',
    tags: ['action', 'sci-fi', 'cyberpunk', 'philosophy']
  }
};

const mockRecommendationNoImage = {
  id: 'test-2',
  name: 'Test Book',
  type: 'book',
  score: 0.72,
  metadata: {
    description: 'A fascinating book about testing.',
    year: 2023,
    genre: 'Technical'
  }
};

// Test wrapper with theme provider
const TestWrapper = ({ children, theme = 'light' }) => (
  <ThemeProvider>
    <div className={theme}>
      {children}
    </div>
  </ThemeProvider>
);

describe('RecommendationCard', () => {
  it('renders recommendation card with all data', () => {
    render(
      <TestWrapper>
        <RecommendationCard recommendation={mockRecommendation} />
      </TestWrapper>
    );

    // Check title
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    
    // Check description
    expect(screen.getByText(/computer programmer discovers reality/)).toBeInTheDocument();
    
    // Check score
    expect(screen.getByText('85%')).toBeInTheDocument();
    
    // Check type
    expect(screen.getByText('Movie')).toBeInTheDocument();
    
    // Check year
    expect(screen.getByText('📅 1999')).toBeInTheDocument();
    
    // Check rating
    expect(screen.getByText('⭐ 8.7')).toBeInTheDocument();
    
    // Check genre
    expect(screen.getByText('🏷️ Sci-Fi')).toBeInTheDocument();
    
    // Check tags (first 3)
    expect(screen.getByText('action')).toBeInTheDocument();
    expect(screen.getByText('sci-fi')).toBeInTheDocument();
    expect(screen.getByText('cyberpunk')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    
    // Check source
    expect(screen.getByText('Qloo')).toBeInTheDocument();
  });

  it('renders placeholder when no image provided', () => {
    render(
      <TestWrapper>
        <RecommendationCard recommendation={mockRecommendationNoImage} />
      </TestWrapper>
    );

    // Should show book emoji placeholder
    expect(screen.getByText('📚')).toBeInTheDocument();
    
    // Should not have img element
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('handles image loading states', async () => {
    render(
      <TestWrapper>
        <RecommendationCard recommendation={mockRecommendation} />
      </TestWrapper>
    );

    const image = screen.getByRole('img');
    expect(image).toHaveClass('opacity-0'); // Initially hidden

    // Simulate image load
    fireEvent.load(image);
    
    await waitFor(() => {
      expect(image).toHaveClass('opacity-100');
    });
  });

  it('handles image error gracefully', async () => {
    render(
      <TestWrapper>
        <RecommendationCard recommendation={mockRecommendation} />
      </TestWrapper>
    );

    const image = screen.getByRole('img');
    
    // Simulate image error
    fireEvent.error(image);
    
    await waitFor(() => {
      // Should show placeholder instead
      expect(screen.getByText('🎬')).toBeInTheDocument();
    });
  });

  it('formats entity types correctly', () => {
    const tvShowRec = {
      ...mockRecommendation,
      type: 'tv_show'
    };

    render(
      <TestWrapper>
        <RecommendationCard recommendation={tvShowRec} />
      </TestWrapper>
    );

    expect(screen.getByText('Tv Show')).toBeInTheDocument();
  });

  it('handles missing metadata gracefully', () => {
    const minimalRec = {
      id: 'test-3',
      name: 'Minimal Recommendation',
      type: 'movie'
    };

    render(
      <TestWrapper>
        <RecommendationCard recommendation={minimalRec} />
      </TestWrapper>
    );

    expect(screen.getByText('Minimal Recommendation')).toBeInTheDocument();
    expect(screen.getByText('Movie')).toBeInTheDocument();
    
    // Should not crash with missing metadata
    expect(screen.queryByText('📅')).not.toBeInTheDocument();
    expect(screen.queryByText('⭐')).not.toBeInTheDocument();
  });

  it('applies hover effects', () => {
    render(
      <TestWrapper>
        <RecommendationCard recommendation={mockRecommendation} />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveClass('hover:scale-[1.02]', 'hover:-translate-y-1');
  });

  it('supports dark mode styling', () => {
    render(
      <TestWrapper theme="dark">
        <RecommendationCard recommendation={mockRecommendation} />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveClass('dark:bg-gray-800', 'dark:shadow-soft-dark');
  });

  it('returns null for invalid recommendation', () => {
    const { container } = render(
      <TestWrapper>
        <RecommendationCard recommendation={null} />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <RecommendationCard 
          recommendation={mockRecommendation} 
          className="custom-class" 
        />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <RecommendationCard recommendation={mockRecommendation} />
      </TestWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', 'Recommendation: The Matrix');
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'The Matrix');
  });

  it('implements lazy loading for images', () => {
    render(
      <TestWrapper>
        <RecommendationCard recommendation={mockRecommendation} />
      </TestWrapper>
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('shows correct placeholder for different entity types', () => {
    const entityTypes = [
      { type: 'movie', emoji: '🎬' },
      { type: 'tv_show', emoji: '📺' },
      { type: 'book', emoji: '📚' },
      { type: 'artist', emoji: '🎵' },
      { type: 'podcast', emoji: '🎙️' },
      { type: 'place', emoji: '📍' },
      { type: 'destination', emoji: '🌍' },
      { type: 'brand', emoji: '🏢' },
      { type: 'person', emoji: '👤' },
      { type: 'unknown', emoji: '❓' }
    ];

    entityTypes.forEach(({ type, emoji }) => {
      const rec = {
        id: `test-${type}`,
        name: `Test ${type}`,
        type,
        metadata: {}
      };

      const { unmount } = render(
        <TestWrapper>
          <RecommendationCard recommendation={rec} />
        </TestWrapper>
      );

      expect(screen.getByText(emoji)).toBeInTheDocument();
      unmount();
    });
  });
});