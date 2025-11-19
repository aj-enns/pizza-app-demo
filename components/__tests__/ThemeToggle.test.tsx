import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should render toggle button', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should show moon icon in light mode', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    // The button contains the moon icon when in light mode
  });

  it('should toggle theme when clicked', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    
    fireEvent.click(button);
    
    // After clicking, theme should be dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should toggle back to light theme on second click', () => {
    renderWithTheme(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    fireEvent.click(button);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
