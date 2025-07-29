import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateId,
  KEYS,
  focusUtils,
  ariaLabels,
  announcements,
  keyboardHandlers,
  liveRegion,
  reducedMotion
} from '../accessibility';

describe('Accessibility Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^test-\d+$/);
    });

    it('should use default prefix when none provided', () => {
      const id = generateId();
      expect(id).toMatch(/^element-\d+$/);
    });
  });

  describe('focusUtils', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should find focusable elements', () => {
      container.innerHTML = `
        <button>Button 1</button>
        <input type="text" />
        <button disabled>Disabled Button</button>
        <a href="#">Link</a>
        <div tabindex="0">Focusable Div</div>
      `;

      const focusableElements = focusUtils.getFocusableElements(container);
      expect(focusableElements).toHaveLength(4); // Excludes disabled button
    });

    it('should focus first element', () => {
      container.innerHTML = `
        <button id="first">First</button>
        <button id="second">Second</button>
      `;

      const result = focusUtils.focusFirst(container);
      expect(result).toBe(true);
      expect(document.activeElement.id).toBe('first');
    });

    it('should focus last element', () => {
      container.innerHTML = `
        <button id="first">First</button>
        <button id="second">Second</button>
      `;

      const result = focusUtils.focusLast(container);
      expect(result).toBe(true);
      expect(document.activeElement.id).toBe('second');
    });

    it('should return false when no focusable elements', () => {
      container.innerHTML = '<div>No focusable elements</div>';
      
      const firstResult = focusUtils.focusFirst(container);
      const lastResult = focusUtils.focusLast(container);
      
      expect(firstResult).toBe(false);
      expect(lastResult).toBe(false);
    });
  });

  describe('ariaLabels', () => {
    it('should generate recommendation card label', () => {
      const recommendation = {
        name: 'The Matrix',
        type: 'movie',
        score: 0.85
      };

      const label = ariaLabels.recommendationCard(recommendation);
      expect(label).toBe('Movie recommendation: The Matrix with 85% match');
    });

    it('should generate filter chip label', () => {
      const label = ariaLabels.filterChip('movie', true, 5);
      expect(label).toBe('Movie filter, active (5 recommendations)');
    });

    it('should generate message bubble label', () => {
      const message = {
        content: 'Hello world',
        timestamp: new Date('2023-01-01T12:00:00Z')
      };

      const label = ariaLabels.messageBubble(message, 'user');
      expect(label).toContain('Message from You');
      expect(label).toContain('Hello world');
    });
  });

  describe('announcements', () => {
    it('should generate loading announcement', () => {
      const announcement = announcements.loading('recommendations');
      expect(announcement).toBe('Loading recommendations...');
    });

    it('should generate completion announcement', () => {
      const announcement = announcements.complete('search', 3);
      expect(announcement).toBe('search completed with 3 results');
    });

    it('should generate error announcement', () => {
      const announcement = announcements.error('processing', 'Network error');
      expect(announcement).toBe('Error during processing: Network error');
    });

    it('should generate filter change announcement', () => {
      const announcement = announcements.filterChange('Movies', true, 5);
      expect(announcement).toBe('Movies filter enabled. 5 recommendations visible.');
    });
  });

  describe('keyboardHandlers', () => {
    describe('gridNavigation', () => {
      it('should handle arrow key navigation', () => {
        const event = { key: KEYS.ARROW_RIGHT, preventDefault: vi.fn() };
        const newIndex = keyboardHandlers.gridNavigation(event, 0, 9, 3);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(newIndex).toBe(1);
      });

      it('should handle boundary conditions', () => {
        const event = { key: KEYS.ARROW_LEFT, preventDefault: vi.fn() };
        const newIndex = keyboardHandlers.gridNavigation(event, 0, 9, 3);
        
        expect(newIndex).toBe(0); // Should stay at first position
      });

      it('should handle home and end keys', () => {
        let event = { key: KEYS.HOME, preventDefault: vi.fn() };
        let newIndex = keyboardHandlers.gridNavigation(event, 5, 9, 3);
        expect(newIndex).toBe(0);

        event = { key: KEYS.END, preventDefault: vi.fn() };
        newIndex = keyboardHandlers.gridNavigation(event, 5, 9, 3);
        expect(newIndex).toBe(8);
      });
    });

    describe('listNavigation', () => {
      it('should handle up/down navigation', () => {
        const event = { key: KEYS.ARROW_DOWN, preventDefault: vi.fn() };
        const newIndex = keyboardHandlers.listNavigation(event, 0, 5);
        
        expect(event.preventDefault).toHaveBeenCalled();
        expect(newIndex).toBe(1);
      });

      it('should wrap around at boundaries', () => {
        let event = { key: KEYS.ARROW_UP, preventDefault: vi.fn() };
        let newIndex = keyboardHandlers.listNavigation(event, 0, 5);
        expect(newIndex).toBe(4); // Wraps to last item

        event = { key: KEYS.ARROW_DOWN, preventDefault: vi.fn() };
        newIndex = keyboardHandlers.listNavigation(event, 4, 5);
        expect(newIndex).toBe(0); // Wraps to first item
      });
    });
  });

  describe('liveRegion', () => {
    afterEach(() => {
      // Clean up any created live regions
      const existingRegion = document.getElementById('live-region');
      if (existingRegion) {
        document.body.removeChild(existingRegion);
      }
    });

    it('should create live region', () => {
      const region = liveRegion.getOrCreate();
      
      expect(region).toBeInstanceOf(HTMLElement);
      expect(region.getAttribute('aria-live')).toBe('polite');
      expect(region.getAttribute('aria-atomic')).toBe('true');
      expect(region.className).toContain('sr-only');
    });

    it('should reuse existing live region', () => {
      const region1 = liveRegion.getOrCreate();
      const region2 = liveRegion.getOrCreate();
      
      expect(region1).toBe(region2);
    });

    it('should announce messages', () => {
      vi.useFakeTimers();
      
      liveRegion.announce('Test message');
      const region = document.getElementById('live-region');
      
      expect(region.textContent).toBe('Test message');
      
      // Should clear after timeout
      vi.advanceTimersByTime(1000);
      expect(region.textContent).toBe('');
      
      vi.useRealTimers();
    });
  });

  describe('reducedMotion', () => {
    it('should detect reduced motion preference', () => {
      // Mock matchMedia
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

      expect(reducedMotion.prefersReduced()).toBe(true);
    });

    it('should return appropriate duration based on preference', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: true,
        })),
      });

      expect(reducedMotion.getDuration(300, 0)).toBe(0);
      
      // Mock no reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(() => ({
          matches: false,
        })),
      });

      expect(reducedMotion.getDuration(300, 0)).toBe(300);
    });
  });
});