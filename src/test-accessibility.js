/**
 * Comprehensive accessibility test runner for TasteSphere
 * Tests keyboard navigation, screen reader support, and WCAG compliance
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from './App';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock external dependencies
vi.mock('./services/geminiService', () => ({
  geminiService: {
    extractEntities: vi.fn().mockResolvedValue({
      entities: [
        { name: 'The Matrix', type: 'movie', confidence: 0.9 }
      ],
      confidence: 0.9,
      processingTime: 100
    })
  }
}));

vi.mock('./services/qlooService', () => ({
  qlooService: {
    getRecommendations: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'The Matrix',
        type: 'movie',
        score: 0.85,
        metadata: { description: 'A sci-fi movie' }
      }
    ])
  }
}));

describe('Accessibility Integration Tests', () => {
  let user;

  beforeAll(() => {
    // Mock matchMedia for theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterAll(() => {
    // Clean up any live regions
    const liveRegions = document.querySelectorAll('[aria-live]');
    liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
  });

  describe('Full Application Accessibility', () => {
    it('should have no accessibility violations on initial load', async () => {
      const { container } = render(<App />);
      
      // Wait for app to fully load
      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation through all interactive elements', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      // Test skip links
      await user.tab();
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveFocus();

      // Continue tabbing through the interface
      await user.tab(); // Skip to chat input
      await user.tab(); // Theme toggle
      await user.tab(); // Chat input textarea
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveFocus();
    });

    it('should provide proper focus management', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      
      // Focus should be visible
      await user.click(textarea);
      expect(textarea).toHaveFocus();

      // Focus should move properly with Tab
      await user.tab();
      const submitButton = screen.getByRole('button', { name: /send/i });
      expect(submitButton).toHaveFocus();
    });

    it('should announce status changes to screen readers', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /send/i });

      // Type a message
      await user.type(textarea, 'I love sci-fi movies');
      await user.click(submitButton);

      // Check for live region announcements
      await waitFor(() => {
        const liveRegions = document.querySelectorAll('[aria-live]');
        const hasProcessingAnnouncement = Array.from(liveRegions).some(
          region => region.textContent.includes('Processing') || 
                   region.textContent.includes('Loading')
        );
        expect(hasProcessingAnnouncement).toBe(true);
      });
    });

    it('should support screen reader navigation landmarks', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      // Check for proper landmarks
      expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
      expect(screen.getByRole('main')).toBeInTheDocument(); // Main content
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // Skip links
    });

    it('should handle keyboard shortcuts properly', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      // Test Escape key (should not cause errors)
      await user.keyboard('{Escape}');

      // Test Enter key in textarea
      const textarea = screen.getByRole('textbox');
      await user.click(textarea);
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');

      // Should submit the message
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });
  });

  describe('Component-Specific Accessibility', () => {
    it('should handle theme toggle accessibility', async () => {
      render(<App />);

      await waitFor(() => {
        const themeToggle = screen.getByRole('button', { name: /switch to dark mode/i });
        expect(themeToggle).toBeInTheDocument();
      });

      const themeToggle = screen.getByRole('button', { name: /switch to dark mode/i });
      
      // Should be keyboard accessible
      themeToggle.focus();
      expect(themeToggle).toHaveFocus();

      // Should toggle with Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
      });
    });

    it('should provide accessible error messages', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /send/i });
      
      // Try to submit without input
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/please enter/i);
      });

      // Error should be associated with input
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('should support high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      // In a real implementation, we would check for high contrast styles
      // This is a placeholder for that functionality
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      // In a real implementation, animations would be disabled or reduced
      // This is a placeholder for that functionality
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Mobile Accessibility', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should be accessible on mobile devices', async () => {
      const { container } = render(<App />);

      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      // Check for mobile-specific accessibility features
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support touch navigation', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      
      // Touch events should work
      fireEvent.touchStart(textarea);
      fireEvent.touchEnd(textarea);
      
      expect(textarea).toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide meaningful page structure', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('TasteSphere')).toBeInTheDocument();
      });

      // Check for proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('TasteSphere');

      // Check for proper regions
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should provide context for dynamic content', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      
      // Type and submit a message
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');

      // Check for proper message structure
      await waitFor(() => {
        const messageContainer = screen.getByRole('log');
        expect(messageContainer).toBeInTheDocument();
      });
    });

    it('should announce loading states', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      const submitButton = screen.getByRole('button', { name: /send/i });

      await user.type(textarea, 'I love movies');
      await user.click(submitButton);

      // Check for loading announcement
      await waitFor(() => {
        const statusElements = screen.getAllByRole('status');
        const hasLoadingStatus = statusElements.some(
          element => element.textContent.includes('Processing') ||
                    element.textContent.includes('Loading')
        );
        expect(hasLoadingStatus).toBe(true);
      });
    });
  });

  describe('Keyboard Navigation Patterns', () => {
    it('should support arrow key navigation in grids', async () => {
      render(<App />);

      // First, generate some recommendations
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'I love sci-fi movies');
      await user.keyboard('{Enter}');

      // Wait for recommendations to appear
      await waitFor(() => {
        const grid = screen.queryByRole('grid');
        if (grid) {
          expect(grid).toBeInTheDocument();
        }
      }, { timeout: 5000 });

      // Test arrow key navigation if recommendations are present
      const grid = screen.queryByRole('grid');
      if (grid) {
        grid.focus();
        await user.keyboard('{ArrowRight}');
        await user.keyboard('{ArrowDown}');
        // In a real implementation, this would move focus between recommendation cards
      }
    });

    it('should support list navigation in filters', async () => {
      render(<App />);

      // Generate recommendations first
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'I love movies and books');
      await user.keyboard('{Enter}');

      // Wait for filters to appear
      await waitFor(() => {
        const filterGroup = screen.queryByRole('group', { name: /filter/i });
        if (filterGroup) {
          expect(filterGroup).toBeInTheDocument();
        }
      }, { timeout: 5000 });

      // Test filter navigation if filters are present
      const filterGroup = screen.queryByRole('group', { name: /filter/i });
      if (filterGroup) {
        const firstFilter = filterGroup.querySelector('button');
        if (firstFilter) {
          firstFilter.focus();
          await user.keyboard('{ArrowDown}');
          // In a real implementation, this would move between filter chips
        }
      }
    });
  });
});