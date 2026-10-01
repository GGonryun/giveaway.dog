import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../theme-toggle';

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

describe('ThemeToggle', () => {
  beforeEach(() => {
    themeState.theme = 'light';
    themeState.setTheme.mockReset();
  });

  it('describes the appearance setting', () => {
    render(<ThemeToggle />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(
      screen.getByText('Choose how the app looks on this device')
    ).toBeInTheDocument();
  });

  it('offers light, dark and system options', () => {
    render(<ThemeToggle />);
    expect(
      screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))
    ).toEqual(['light', 'dark', 'system']);
  });

  it.each([
    ['light', 'Light'],
    ['dark', 'Dark'],
    ['system', 'System']
  ])('checks the %s option when it is the current theme', (theme, label) => {
    themeState.theme = theme;
    render(<ThemeToggle />);
    expect(screen.getByRole('radio', { name: label })).toBeChecked();
    expect(
      screen
        .getAllByRole('radio')
        .filter((radio) => radio.ariaChecked === 'true')
    ).toHaveLength(1);
  });

  it('checks no option when the theme is not known yet', () => {
    themeState.theme = undefined;
    render(<ThemeToggle />);
    screen.getAllByRole('radio').forEach((radio) => {
      expect(radio).not.toBeChecked();
    });
  });

  it('changes the theme when an option is chosen', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(themeState.setTheme).toHaveBeenCalledExactlyOnceWith('dark');
  });

  it('changes the theme when an option label is clicked', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByText('System'));
    expect(themeState.setTheme).toHaveBeenCalledExactlyOnceWith('system');
  });

  it('does not change the theme when the current option is chosen again', async () => {
    render(<ThemeToggle />);
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));
    expect(themeState.setTheme).not.toHaveBeenCalled();
  });
});
