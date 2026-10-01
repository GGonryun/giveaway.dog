import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggleButton } from '../theme-toggle-button';

const themeState = vi.hoisted(() => ({
  theme: 'light' as string | undefined,
  setTheme: vi.fn()
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: themeState.theme,
    setTheme: themeState.setTheme
  })
}));

const trigger = () => screen.getByRole('button', { name: 'Toggle theme' });

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    themeState.theme = 'light';
    themeState.setTheme.mockReset();
  });

  it.each(['light', 'dark'])(
    'shows the sun and moon icons when the theme is %s',
    (theme) => {
      themeState.theme = theme;
      render(<ThemeToggleButton />);
      expect(trigger().querySelector('.lucide-sun')).toBeInTheDocument();
      expect(trigger().querySelector('.lucide-moon')).toBeInTheDocument();
      expect(
        trigger().querySelector('.lucide-monitor')
      ).not.toBeInTheDocument();
    }
  );

  it('shows only the monitor icon when following the system theme', () => {
    themeState.theme = 'system';
    render(<ThemeToggleButton />);
    expect(trigger().querySelector('.lucide-monitor')).toBeInTheDocument();
    expect(trigger().querySelector('.lucide-sun')).not.toBeInTheDocument();
    expect(trigger().querySelector('.lucide-moon')).not.toBeInTheDocument();
  });

  it('opens a menu with the three theme options', async () => {
    render(<ThemeToggleButton />);
    await userEvent.click(trigger());
    expect(
      screen.getAllByRole('menuitem').map((item) => item.textContent)
    ).toEqual(['Light', 'Dark', 'System']);
  });

  it.each([
    ['Light', 'light'],
    ['Dark', 'dark'],
    ['System', 'system']
  ])('sets the theme when %s is chosen', async (label, value) => {
    render(<ThemeToggleButton />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole('menuitem', { name: label }));
    expect(themeState.setTheme).toHaveBeenCalledExactlyOnceWith(value);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not change the theme until an option is chosen', async () => {
    render(<ThemeToggleButton />);
    await userEvent.click(trigger());
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(themeState.setTheme).not.toHaveBeenCalled();
  });
});
