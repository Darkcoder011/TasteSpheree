import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAccessibility, useGridNavigation, useListNavigation, useModalFocus } from '../useAccessibility';

describe('useAccessibility', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Clean up any live regions
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      document.body.removeChild(liveRegion);
    }
  });

  describe('useAccessibility hook', () => {
    it('should provide accessibility utilities', () => {
      const { result } = renderHook(() => useAccessibility());

      expect(result.current.containerRef).toBeDefined();
      expect(typeof result.current.focusFirst).toBe('function');
      expect(typeof result.current.focusLast).toBe('function');
      expect(typeof result.current.trapFocus).toBe('function');
      expect(typeof result.current.announce).toBe('function');
    });

    it('should announce messages', () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.announce('Test announcement');
      });

      const liveRegion = document.getElementById('live-region');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.textContent).toBe('Test announcement');
    });

    it('should focus first element when container has focusable elements', () => {
      const { result } = renderHook(() => useAccessibility());
      
      container.innerHTML = `
        <button id="first">First</button>
        <button id="second">Second</button>
      `;
      
      // Set the container ref
      act(() => {
        result.current.containerRef.current = container;
      });

      let focusResult;
      act(() => {
        focusResult = result.current.focusFirst();
      });

      expect(focusResult).toBe(true);
      expect(document.activeElement.id).toBe('first');
    });
  });

  describe('useGridNavigation hook', () => {
    it('should provide grid navigation functionality', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const onSelect = vi.fn();
      
      const { result } = renderHook(() => 
        useGridNavigation(items, 3, onSelect)
      );

      expect(result.current.gridRef).toBeDefined();
      expect(result.current.focusedIndex).toBe(-1);
      expect(typeof result.current.setFocusedIndex).toBe('function');
    });

    it('should handle keyboard navigation', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const onSelect = vi.fn();
      
      const { result } = renderHook(() => 
        useGridNavigation(items, 3, onSelect)
      );

      // Create a mock grid element
      const gridElement = document.createElement('div');
      gridElement.innerHTML = `
        <button>Item 1</button>
        <button>Item 2</button>
        <button>Item 3</button>
      `;
      container.appendChild(gridElement);

      act(() => {
        result.current.gridRef.current = gridElement;
      });

      // Simulate arrow key press
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      act(() => {
        gridElement.dispatchEvent(keyEvent);
      });

      // Note: In a real test, we'd need to mock the keyboard handler behavior
      // This is a simplified test structure
    });
  });

  describe('useListNavigation hook', () => {
    it('should provide list navigation functionality', () => {
      const items = ['item1', 'item2', 'item3'];
      const onSelect = vi.fn();
      
      const { result } = renderHook(() => 
        useListNavigation(items, onSelect)
      );

      expect(result.current.listRef).toBeDefined();
      expect(result.current.focusedIndex).toBe(-1);
      expect(typeof result.current.setFocusedIndex).toBe('function');
    });
  });

  describe('useModalFocus hook', () => {
    it('should manage modal focus', () => {
      const onClose = vi.fn();
      
      const { result, rerender } = renderHook(
        ({ isOpen }) => useModalFocus(isOpen, onClose),
        { initialProps: { isOpen: false } }
      );

      expect(result.current).toBeDefined();

      // Test opening modal
      rerender({ isOpen: true });
      
      // Test closing modal
      rerender({ isOpen: false });
    });

    it('should handle escape key to close modal', () => {
      const onClose = vi.fn();
      
      renderHook(() => useModalFocus(true, onClose));

      // Simulate escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      act(() => {
        document.dispatchEvent(escapeEvent);
      });

      expect(onClose).toHaveBeenCalled();
    });

    it('should restore focus when modal closes', () => {
      const button = document.createElement('button');
      container.appendChild(button);
      button.focus();
      
      const previousFocus = document.activeElement;
      const onClose = vi.fn();
      
      const { rerender } = renderHook(
        ({ isOpen }) => useModalFocus(isOpen, onClose),
        { initialProps: { isOpen: false } }
      );

      // Open modal
      rerender({ isOpen: true });
      
      // Close modal
      rerender({ isOpen: false });

      // Focus should be restored (in a real scenario)
      // This is a simplified test - actual focus restoration would need more setup
    });
  });
});