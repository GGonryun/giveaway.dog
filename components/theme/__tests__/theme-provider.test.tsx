import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTheme } from 'next-themes';
import { afterEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../theme-provider';

const ThemeProbe = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <p>Current theme: {theme ?? 'none'}</p>
      <button type="button" onClick={() => setTheme('dark')}>
        Use dark theme
      </button>
    </div>
  );
};

describe('ThemeProvider', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('class');
    document.documentElement.removeAttribute('style');
  });

  it('renders its children', () => {
    render(
      <ThemeProvider>
        <p>Page content</p>
      </ThemeProvider>
    );
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('exposes the default theme to descendants', () => {
    render(
      <ThemeProvider defaultTheme="light" enableSystem={false}>
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(screen.getByText('Current theme: light')).toBeInTheDocument();
  });

  it('applies the theme as a class on the document element', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(document.documentElement).toHaveClass('dark');
  });

  it('switches and persists the theme under the configured storage key', async () => {
    render(
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="giveaway-theme"
      >
        <ThemeProbe />
      </ThemeProvider>
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Use dark theme' })
    );
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('giveaway-theme')).toBe('dark');
  });

  it('restores a previously stored theme', () => {
    localStorage.setItem('giveaway-theme', 'dark');
    render(
      <ThemeProvider
        defaultTheme="light"
        enableSystem={false}
        storageKey="giveaway-theme"
      >
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
  });
});
