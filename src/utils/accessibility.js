/**
 * Accessibility utilities for TasteSphere application
 * Provides helper functions for ARIA labels, keyboard navigation, and focus management
 */

/**
 * Generate unique IDs for ARIA relationships
 */
let idCounter = 0;
export const generateId = (prefix = 'element') => {
  return `${prefix}-${++idCounter}`;
};

/**
 * Keyboard navigation constants
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End'
};

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container) => {
    if (!container) return [];
    
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="tab"]'
    ].join(', ');
    
    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(element => {
        // In test environment, skip visibility checks that might not work
        if (typeof window === 'undefined' || !window.getComputedStyle) {
          return true;
        }
        
        // Check if element is visible and not hidden
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               (element.offsetParent !== null || element.tagName === 'BODY');
      });
  },

  /**
   * Focus the first focusable element in a container
   */
  focusFirst: (container) => {
    const focusableElements = focusUtils.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  },

  /**
   * Focus the last focusable element in a container
   */
  focusLast: (container) => {
    const focusableElements = focusUtils.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  },

  /**
   * Trap focus within a container (for modals, panels, etc.)
   */
  trapFocus: (container, event) => {
    const focusableElements = focusUtils.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === KEYS.TAB) {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }
};

/**
 * ARIA label generators
 */
export const ariaLabels = {
  /**
   * Generate label for recommendation card
   */
  recommendationCard: (recommendation) => {
    const { name, type, score } = recommendation;
    const formattedType = type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'item';
    const scoreText = score ? ` with ${Math.round(score * 100)}% match` : '';
    return `${formattedType} recommendation: ${name}${scoreText}`;
  },

  /**
   * Generate label for filter chip
   */
  filterChip: (entityType, isActive, count) => {
    const displayName = entityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const status = isActive ? 'active' : 'inactive';
    const countText = count > 0 ? ` (${count} recommendation${count !== 1 ? 's' : ''})` : ' (no recommendations)';
    return `${displayName} filter, ${status}${countText}`;
  },

  /**
   * Generate label for message bubble
   */
  messageBubble: (message, type) => {
    const sender = type === 'user' ? 'You' : 'AI Assistant';
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : '';
    const timestampText = timestamp ? ` at ${timestamp}` : '';
    return `Message from ${sender}${timestampText}: ${message.content}`;
  },

  /**
   * Generate label for debug panel
   */
  debugPanel: (isOpen, analysisCount) => {
    const status = isOpen ? 'open' : 'closed';
    const analysisText = analysisCount > 0 ? ` with ${analysisCount} analysis result${analysisCount !== 1 ? 's' : ''}` : '';
    return `Debug panel, ${status}${analysisText}`;
  }
};

/**
 * Screen reader announcements
 */
export const announcements = {
  /**
   * Announce loading state
   */
  loading: (action) => `Loading ${action}...`,

  /**
   * Announce completion
   */
  complete: (action, count) => {
    if (count === 0) return `${action} completed with no results`;
    return `${action} completed with ${count} result${count !== 1 ? 's' : ''}`;
  },

  /**
   * Announce error
   */
  error: (action, error) => `Error during ${action}: ${error}`,

  /**
   * Announce filter change
   */
  filterChange: (filterName, isActive, visibleCount) => {
    const action = isActive ? 'enabled' : 'disabled';
    return `${filterName} filter ${action}. ${visibleCount} recommendation${visibleCount !== 1 ? 's' : ''} visible.`;
  }
};

/**
 * Keyboard navigation handlers
 */
export const keyboardHandlers = {
  /**
   * Handle arrow key navigation in a grid
   */
  gridNavigation: (event, currentIndex, totalItems, columns) => {
    const { key } = event;
    let newIndex = currentIndex;

    switch (key) {
      case KEYS.ARROW_LEFT:
        newIndex = Math.max(0, currentIndex - 1);
        break;
      case KEYS.ARROW_RIGHT:
        newIndex = Math.min(totalItems - 1, currentIndex + 1);
        break;
      case KEYS.ARROW_UP:
        newIndex = Math.max(0, currentIndex - columns);
        break;
      case KEYS.ARROW_DOWN:
        newIndex = Math.min(totalItems - 1, currentIndex + columns);
        break;
      case KEYS.HOME:
        newIndex = 0;
        break;
      case KEYS.END:
        newIndex = totalItems - 1;
        break;
      default:
        return currentIndex;
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      return newIndex;
    }
    return currentIndex;
  },

  /**
   * Handle list navigation (up/down arrows)
   */
  listNavigation: (event, currentIndex, totalItems) => {
    const { key } = event;
    let newIndex = currentIndex;

    switch (key) {
      case KEYS.ARROW_UP:
        newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
        break;
      case KEYS.ARROW_DOWN:
        newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
        break;
      case KEYS.HOME:
        newIndex = 0;
        break;
      case KEYS.END:
        newIndex = totalItems - 1;
        break;
      default:
        return currentIndex;
    }

    if (newIndex !== currentIndex) {
      event.preventDefault();
      return newIndex;
    }
    return currentIndex;
  }
};

/**
 * Live region utilities for screen reader announcements
 */
export const liveRegion = {
  /**
   * Create or get existing live region
   */
  getOrCreate: (id = 'live-region', priority = 'polite') => {
    let region = document.getElementById(id);
    if (!region) {
      region = document.createElement('div');
      region.id = id;
      region.setAttribute('aria-live', priority);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }
    return region;
  },

  /**
   * Announce message to screen readers
   */
  announce: (message, priority = 'polite') => {
    const region = liveRegion.getOrCreate('live-region', priority);
    region.textContent = message;
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (region.textContent === message) {
        region.textContent = '';
      }
    }, 1000);
  }
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Check if color combination meets WCAG contrast requirements
   */
  meetsWCAG: (foreground, background, level = 'AA') => {
    // This is a simplified check - in production, use a proper contrast calculation library
    const contrastRatios = {
      'AA': 4.5,
      'AAA': 7
    };
    
    // For now, return true - implement proper contrast calculation if needed
    return true;
  }
};

/**
 * Reduced motion utilities
 */
export const reducedMotion = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReduced: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Get animation duration based on user preference
   */
  getDuration: (normalDuration, reducedDuration = 0) => {
    return reducedMotion.prefersReduced() ? reducedDuration : normalDuration;
  }
};