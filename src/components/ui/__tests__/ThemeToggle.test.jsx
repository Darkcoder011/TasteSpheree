import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../../../contexts/ThemeContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
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

const renderWithTheme = (component, initialTheme = 'light') => {
  localStorageMock.getItem.mockReturnValue(initialTheme);
  
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders theme toggle button', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  it('shows sun icon in light mode', () => {
    renderWithTheme(<ThemeToggle />, 'light');
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Check for sun icon (svg with specific path)
    const sunIcon = button.querySelector('svg path[d*="M12 3v1m0 16v1m9-9h-1M4 12H3"]');
    expect(sunIcon).toBeInTheDocument();
  });

  it('shows moon icon in dark mode', () => {
    renderWithTheme(<ThemeToggle />, 'dark');
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    
    // Check for moon icon (svg with specific path)
    const moonIcon = button.querySelector('svg path[d*="M20.354 15.354A9 9 0 018.646 3.646"]');
    expect(moonIcon).toBeInTheDocument();
  });

  it('toggles theme when clicked', () => {
    renderWithTheme(<ThemeToggle />, 'light');
    
    const button = screen.getByRole('button');
    
    // Initially should show "Switch to dark mode"
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    
    // Click to toggle
    fireEvent.click(button);
    
    // Should now show "Switch to light mode"
    expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
  });

  it('applies correct size classes', () => {
    const { rerender } = renderWithTheme(<ThemeToggle size="sm" />);
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-5', 'w-9');
    
    rerender(
      <ThemeProvider>
        <ThemeToggle size="md" />
      </ThemeProvider>
    );
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-6', 'w-11');
    
    rerender(
      <ThemeProvider>
        <ThemeToggle size="lg" />
      </ThemeProvider>
    );
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-7', 'w-13');
  });

  it('applies custom className', () => {
    renderWithTheme(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    renderWithTheme(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('shows correct background colors for different themes', () => {
    const { rerender } = renderWithTheme(<ThemeToggle />, 'light');
    
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
    
    rerender(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    // Click to switch to dark mode
    fireEvent.click(button);
    
    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });
});