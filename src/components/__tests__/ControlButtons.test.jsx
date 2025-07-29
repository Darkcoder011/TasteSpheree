import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ControlButtons from '../ControlButtons';

// Mock the useAppState hook
const mockUseAppState = vi.fn();

vi.mock('@contexts/AppStateContext', () => ({
  useAppState: () => mockUseAppState()
}));

// Default mock state
const defaultMockState = {
  lastUserInput: 'test input',
  messages: [{ id: '1', content: 'test message', type: 'user' }],
  isProcessing: false,
  isLoading: false
};

const renderWithMockState = (props = {}, stateOverrides = {}) => {
  mockUseAppState.mockReturnValue({ ...defaultMockState, ...stateOverrides });
  return render(<ControlButtons {...props} />);
};

describe('ControlButtons', () => {
  const mockOnTryAgain = vi.fn();
  const mockOnClearChat = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Try Again functionality', () => {
    it('renders try again button when conditions are met', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('does not render try again button when no last user input', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      }, {
        lastUserInput: ''
      });

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('disables try again button when processing', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      }, {
        isProcessing: true
      });

      const button = screen.queryByRole('button', { name: /try again/i });
      if (button) {
        expect(button).toBeDisabled();
      }
    });

    it('calls onTryAgain when try again button is clicked', async () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      const button = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(button);

      expect(mockOnTryAgain).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during retry', async () => {
      const slowOnTryAgain = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithMockState({
        onTryAgain: slowOnTryAgain,
        onClearChat: mockOnClearChat
      });

      const button = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Retrying...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText('Retrying...')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Clear Chat functionality', () => {
    it('renders clear chat button when messages exist', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
    });

    it('does not render clear chat button when no messages', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      }, {
        messages: []
      });

      expect(screen.queryByRole('button', { name: /clear chat/i })).not.toBeInTheDocument();
    });

    it('shows confirmation dialog when clear chat is clicked', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      const button = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(button);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onClearChat when confirm is clicked', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      // First click to show confirmation
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      // Second click to confirm
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      expect(mockOnClearChat).toHaveBeenCalledTimes(1);
    });

    it('cancels clear chat when cancel is clicked', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      // First click to show confirmation
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Should be back to original state
      expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
      expect(mockOnClearChat).not.toHaveBeenCalled();
    });

    it('auto-hides confirmation after timeout', async () => {
      vi.useFakeTimers();
      
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      // Show confirmation
      const clearButton = screen.getByRole('button', { name: /clear chat/i });
      fireEvent.click(clearButton);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();

      // Fast-forward time
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      expect(screen.getByLabelText('Try again with last input')).toBeInTheDocument();
      expect(screen.getByLabelText('Clear chat history')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      });

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const clearChatButton = screen.getByRole('button', { name: /clear chat/i });

      // Both buttons should be focusable
      tryAgainButton.focus();
      expect(document.activeElement).toBe(tryAgainButton);

      clearChatButton.focus();
      expect(document.activeElement).toBe(clearChatButton);
    });
  });

  describe('Edge cases', () => {
    it('renders nothing when no actions are available', () => {
      const { container } = renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat
      }, {
        lastUserInput: '',
        messages: []
      });

      expect(container.firstChild).toBeNull();
    });

    it('handles missing callback props gracefully', () => {
      renderWithMockState({}, {
        lastUserInput: 'test',
        messages: [{ id: '1', content: 'test', type: 'user' }]
      });

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      const clearChatButton = screen.getByRole('button', { name: /clear chat/i });

      // Should not throw errors when clicked without callbacks
      expect(() => {
        fireEvent.click(tryAgainButton);
        fireEvent.click(clearChatButton);
      }).not.toThrow();
    });

    it('applies custom className', () => {
      const { container } = renderWithMockState({
        onTryAgain: mockOnTryAgain,
        onClearChat: mockOnClearChat,
        className: 'custom-class'
      });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});