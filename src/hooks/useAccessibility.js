import { useEffect, useRef, useCallback, useState } from 'react';
import { focusUtils, liveRegion, KEYS, keyboardHandlers } from '../utils/accessibility';

/**
 * Custom hook for accessibility features
 * Provides focus management, keyboard navigation, and screen reader support
 */
export const useAccessibility = () => {
  const containerRef = useRef(null);

  /**
   * Focus the first focusable element in the container
   */
  const focusFirst = useCallback(() => {
    if (containerRef.current) {
      return focusUtils.focusFirst(containerRef.current);
    }
    return false;
  }, []);

  /**
   * Focus the last focusable element in the container
   */
  const focusLast = useCallback(() => {
    if (containerRef.current) {
      return focusUtils.focusLast(containerRef.current);
    }
    return false;
  }, []);

  /**
   * Trap focus within the container
   */
  const trapFocus = useCallback((event) => {
    if (containerRef.current) {
      focusUtils.trapFocus(containerRef.current, event);
    }
  }, []);

  /**
   * Announce message to screen readers
   */
  const announce = useCallback((message, priority = 'polite') => {
    liveRegion.announce(message, priority);
  }, []);

  return {
    containerRef,
    focusFirst,
    focusLast,
    trapFocus,
    announce
  };
};

/**
 * Hook for keyboard navigation in grids (like recommendation cards)
 */
export const useGridNavigation = (items, columns = 3, onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef(null);

  const handleKeyDown = useCallback((event) => {
    if (!items.length) return;

    const newIndex = keyboardHandlers.gridNavigation(
      event,
      focusedIndex,
      items.length,
      columns
    );

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      
      // Focus the element
      const gridElement = gridRef.current;
      if (gridElement) {
        const focusableElements = focusUtils.getFocusableElements(gridElement);
        if (focusableElements[newIndex]) {
          focusableElements[newIndex].focus();
        }
      }
    }

    // Handle selection
    if ((event.key === KEYS.ENTER || event.key === KEYS.SPACE) && onSelect) {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < items.length) {
        onSelect(items[focusedIndex], focusedIndex);
      }
    }
  }, [items, columns, focusedIndex, onSelect]);

  useEffect(() => {
    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener('keydown', handleKeyDown);
      return () => gridElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  return {
    gridRef,
    focusedIndex,
    setFocusedIndex
  };
};

/**
 * Hook for keyboard navigation in lists (like filter chips)
 */
export const useListNavigation = (items, onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef(null);

  const handleKeyDown = useCallback((event) => {
    if (!items.length) return;

    const newIndex = keyboardHandlers.listNavigation(
      event,
      focusedIndex,
      items.length
    );

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex);
      
      // Focus the element
      const listElement = listRef.current;
      if (listElement) {
        const focusableElements = focusUtils.getFocusableElements(listElement);
        if (focusableElements[newIndex]) {
          focusableElements[newIndex].focus();
        }
      }
    }

    // Handle selection
    if ((event.key === KEYS.ENTER || event.key === KEYS.SPACE) && onSelect) {
      event.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < items.length) {
        onSelect(items[focusedIndex], focusedIndex);
      }
    }
  }, [items, focusedIndex, onSelect]);

  useEffect(() => {
    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('keydown', handleKeyDown);
      return () => listElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  return {
    listRef,
    focusedIndex,
    setFocusedIndex
  };
};

/**
 * Hook for managing modal/panel focus
 */
export const useModalFocus = (isOpen, onClose) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement;
      
      // Focus the modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Handle escape key
      const handleEscape = (event) => {
        if (event.key === KEYS.ESCAPE && onClose) {
          onClose();
        }
      };

      // Handle focus trap
      const handleKeyDown = (event) => {
        if (modalRef.current) {
          focusUtils.trapFocus(modalRef.current, event);
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen, onClose]);

  return modalRef;
};

/**
 * Hook for skip links navigation
 */
export const useSkipLinks = () => {
  const skipLinksRef = useRef(null);

  const addSkipLink = useCallback((targetId, label) => {
    if (!skipLinksRef.current) return;

    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.textContent = label;
    link.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2 z-50';
    
    skipLinksRef.current.appendChild(link);
  }, []);

  return {
    skipLinksRef,
    addSkipLink
  };
};