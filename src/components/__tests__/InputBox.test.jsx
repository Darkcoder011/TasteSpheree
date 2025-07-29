import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InputBox from '../InputBox.jsx';
import { AppStateProvider } from '@contexts/AppStateContext.jsx';

// Mock the contexts
const renderWithProviders = (component, initialState = {}) => {
  return render(
    <AppStateProvider>
      {component}
    </AppStateProvider>
  );
};

describe('InputBox Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders with default placeholder', () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText('Tell me about your interests...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit your interests/i })).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    const customPlaceholder = 'Enter your custom message...';
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} placeholder={customPlaceholder} />);
    
    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('shows character counter', () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('0/500')).toBeInTheDocument();
  });

  it('updates character counter when typing', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    
    await waitFor(() => {
      expect(screen.getByText('11/500')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty input', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit your interests/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter your interests or preferences')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for input too short', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: 'Hi' } });
    
    const submitButton = screen.getByRole('button', { name: /submit your interests/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter at least 3 characters')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error for input too long', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const longText = 'a'.repeat(501);
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: longText } });
    
    const submitButton = screen.getByRole('button', { name: /submit your interests/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please keep your input under 500 characters')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid input', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const validInput = 'I love sci-fi movies and jazz music';
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: validInput } });
    
    const submitButton = screen.getByRole('button', { name: /submit your interests/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validInput);
    });
  });

  it('submits on Enter key press', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const validInput = 'I love sci-fi movies';
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: validInput } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(validInput);
    });
  });

  it('does not submit on Shift+Enter', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const validInput = 'I love sci-fi movies';
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: validInput } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    
    // Wait a bit to ensure no submission occurs
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('clears input after successful submission', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const validInput = 'I love sci-fi movies';
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: validInput } });
    
    const submitButton = screen.getByRole('button', { name: /submit your interests/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(textarea.value).toBe('');
    });
  });

  it('shows help text when no error', () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    expect(screen.getByText('Press Enter to send, Shift+Enter for new line')).toBeInTheDocument();
  });

  it('clears validation error when user starts typing valid input', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    // First trigger validation error
    const submitButton = screen.getByRole('button', { name: /submit your interests/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter your interests or preferences')).toBeInTheDocument();
    });
    
    // Then type valid input
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: 'Valid input' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Please enter your interests or preferences')).not.toBeInTheDocument();
    });
  });

  it('shows warning color for character count near limit', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const nearLimitText = 'a'.repeat(450);
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: nearLimitText } });
    
    await waitFor(() => {
      const counter = screen.getByText('450/500');
      expect(counter).toHaveClass('text-orange-500');
    });
  });

  it('disables submit button when input is empty', () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: /submit your interests/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when input is valid', async () => {
    renderWithProviders(<InputBox onSubmit={mockOnSubmit} />);
    
    const textarea = screen.getByPlaceholderText('Tell me about your interests...');
    fireEvent.change(textarea, { target: { value: 'Valid input' } });
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /submit your interests/i });
      expect(submitButton).not.toBeDisabled();
    });
  });
});