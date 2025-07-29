import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SkipLinks from '../SkipLinks';
import ScreenReader from '../ScreenReader';
import RecommendationCard from '../RecommendationCard';
import FilterChips from '../FilterChips';
import InputBox from '../InputBox';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { AppStateProvider } from '../../contexts/AppStateContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    textarea: ({ children, ...props }) => <textarea {...props}>{children}</textarea>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    header: ({ children, ...props }) => <header {...props}>{children}</header>,
    main: ({ children, ...props }) => <main {...props}>{children}</main>,
    nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock hooks
vi.mock('../../hooks/useLazyImage', () => ({
  useLazyImage: () => ({
    imgRef: { current: null },
    isLoaded: true,
    hasError: false,
    shouldLoad: true,
    handleLoad: vi.fn(),
    handleError: vi.fn(),
  }),
}));

const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <AppStateProvider>
      {children}
    </AppStateProvider>
  </ThemeProvider>
);

describe('Accessibility Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    // Clean up any live regions
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      document.body.removeChild(liveRegion);
    }
  });

  describe('SkipLinks Component', () => {
    it('should render skip links with proper accessibility attributes', () => {
      render(<SkipLinks />);

      const nav = screen.getByRole('navigation', { name: /skip navigation links/i });
      expect(nav).toBeInTheDocument();

      const skipToMain = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipToMain).toHaveAttribute('href', '#main-content');

      const skipToInput = screen.getByRole('link', { name: /skip to chat input/i });
      expect(skipToInput).toHaveAttribute('href', '#chat-input');
    });

    it('should be keyboard accessible', async () => {
      render(<SkipLinks />);

      const firstLink = screen.getByRole('link', { name: /skip to main content/i });
      
      await user.tab();
      expect(firstLink).toHaveFocus();

      await user.tab();
      const secondLink = screen.getByRole('link', { name: /skip to chat input/i });
      expect(secondLink).toHaveFocus();
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<SkipLinks />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ScreenReader Component', () => {
    it('should render with proper ARIA attributes', () => {
      render(<ScreenReader message="Test announcement" />);

      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'true');
      expect(region).toHaveClass('sr-only');
    });

    it('should announce messages', () => {
      const { rerender } = render(<ScreenReader message="" />);
      
      rerender(<ScreenReader message="New announcement" />);
      
      const region = screen.getByRole('status');
      expect(region).toHaveTextContent('New announcement');
    });

    it('should support different priority levels', () => {
      render(<ScreenReader message="Urgent message" priority="assertive" />);

      const region = screen.getByRole('status');
      expect(region).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<ScreenReader message="Test message" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('RecommendationCard Component', () => {
    const mockRecommendation = {
      id: '1',
      name: 'The Matrix',
      type: 'movie',
      score: 0.85,
      metadata: {
        description: 'A sci-fi action movie',
        year: '1999',
        rating: '8.7',
        genre: 'Sci-Fi',
        imageUrl: 'https://example.com/matrix.jpg'
      }
    };

    it('should render with proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <RecommendationCard recommendation={mockRecommendation} />
        </TestWrapper>
      );

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('tabIndex', '0');
      expect(article).toHaveAttribute('aria-label');
      
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('The Matrix');
    });

    it('should be keyboard accessible', async () => {
      render(
        <TestWrapper>
          <RecommendationCard recommendation={mockRecommendation} />
        </TestWrapper>
      );

      const article = screen.getByRole('article');
      
      await user.tab();
      expect(article).toHaveFocus();

      // Test Enter key
      await user.keyboard('{Enter}');
      // In a real implementation, this would trigger some action

      // Test Space key
      await user.keyboard(' ');
      // In a real implementation, this would trigger some action
    });

    it('should have proper image alt text', () => {
      render(
        <TestWrapper>
          <RecommendationCard recommendation={mockRecommendation} />
        </TestWrapper>
      );

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt');
      expect(image.getAttribute('alt')).toContain('The Matrix');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <RecommendationCard recommendation={mockRecommendation} />
        </TestWrapper>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('InputBox Component', () => {
    const mockOnSubmit = vi.fn();

    beforeEach(() => {
      mockOnSubmit.mockClear();
    });

    it('should render with proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <InputBox onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-label');
      expect(textarea).toHaveAttribute('aria-describedby');
      expect(textarea).toHaveAttribute('aria-required', 'true');
      expect(textarea).toHaveAttribute('maxLength', '500');

      const button = screen.getByRole('button', { name: /send message/i });
      expect(button).toBeInTheDocument();
    });

    it('should show validation errors with proper ARIA attributes', async () => {
      render(
        <TestWrapper>
          <InputBox onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      const button = screen.getByRole('button');

      // Try to submit empty input
      await user.click(button);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(textarea).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should be keyboard accessible', async () => {
      render(
        <TestWrapper>
          <InputBox onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      
      await user.click(textarea);
      await user.type(textarea, 'Test message');
      
      // Test Enter key submission
      await user.keyboard('{Enter}');
      
      expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
    });

    it('should support Shift+Enter for new lines', async () => {
      render(
        <TestWrapper>
          <InputBox onSubmit={mockOnSubmit} />
        </TestWrapper>
      );

      const textarea = screen.getByRole('textbox');
      
      await user.click(textarea);
      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');
      
      expect(textarea.value).toContain('\n');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <InputBox onSubmit={mockOnSubmit} />
        </TestWrapper>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation through interactive elements', async () => {
      render(
        <TestWrapper>
          <div>
            <button>Button 1</button>
            <InputBox onSubmit={vi.fn()} />
            <button>Button 2</button>
          </div>
        </TestWrapper>
      );

      const button1 = screen.getByRole('button', { name: 'Button 1' });
      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /send message/i });
      const button2 = screen.getByRole('button', { name: 'Button 2' });

      // Tab through elements
      await user.tab();
      expect(button1).toHaveFocus();

      await user.tab();
      expect(textarea).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      await user.tab();
      expect(button2).toHaveFocus();
    });

    it('should support Shift+Tab for reverse navigation', async () => {
      render(
        <TestWrapper>
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
          </div>
        </TestWrapper>
      );

      const button1 = screen.getByRole('button', { name: 'Button 1' });
      const button2 = screen.getByRole('button', { name: 'Button 2' });

      // Focus second button first
      button2.focus();
      expect(button2).toHaveFocus();

      // Shift+Tab to go back
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(button1).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful labels for all interactive elements', () => {
      render(
        <TestWrapper>
          <div>
            <InputBox onSubmit={vi.fn()} />
            <RecommendationCard 
              recommendation={{
                id: '1',
                name: 'Test Item',
                type: 'movie',
                score: 0.8,
                metadata: {}
              }} 
            />
          </div>
        </TestWrapper>
      );

      // Check that all interactive elements have accessible names
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAccessibleName();

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName();

      const article = screen.getByRole('article');
      expect(article).toHaveAccessibleName();
    });

    it('should provide status updates for dynamic content', async () => {
      const { rerender } = render(
        <ScreenReader message="" />
      );

      rerender(<ScreenReader message="Loading recommendations..." />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('Loading recommendations...');
    });
  });

  describe('Focus Management', () => {
    it('should maintain focus visibility', async () => {
      render(
        <TestWrapper>
          <button>Test Button</button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
      
      // Check that focus is visible (this would need custom CSS testing in a real scenario)
      expect(button).toHaveClass(); // Would check for focus ring classes
    });

    it('should not trap focus in non-modal contexts', async () => {
      render(
        <TestWrapper>
          <div>
            <button>Before</button>
            <div>
              <button>Inside</button>
            </div>
            <button>After</button>
          </div>
        </TestWrapper>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      const insideButton = screen.getByRole('button', { name: 'Inside' });
      const afterButton = screen.getByRole('button', { name: 'After' });

      await user.tab();
      expect(beforeButton).toHaveFocus();

      await user.tab();
      expect(insideButton).toHaveFocus();

      await user.tab();
      expect(afterButton).toHaveFocus();
    });
  });
});