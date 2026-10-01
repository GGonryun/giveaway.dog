import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileThemeToggle } from '../mobile-theme-toggle';

const themeState = vi.hoisted(() => ({
  theme: 'system' as string | undefined,
  setTheme: vi.fn()
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: themeState.theme,
    setTheme: themeState.setTheme
  })
}));

describe('MobileThemeToggle', () => {
  beforeEach(() => {
    themeState.theme = 'system';
    themeState.setTheme.mockReset();
  });

  it('labels the control and applies the text class', () => {
    render(<MobileThemeToggle textClassName="text-sm" />);
    expect(screen.getByText('Theme')).toHaveClass('font-medium', 'text-sm');
  });

  it('offers system, light and dark options in that order', () => {
    render(<MobileThemeToggle />);
    expect(
      screen.getAllByRole('radio').map((radio) => radio.ariaLabel)
    ).toEqual(['System theme', 'Light theme', 'Dark theme']);
  });

  it.each([
    ['system', 'System theme'],
    ['light', 'Light theme'],
    ['dark', 'Dark theme']
  ])('checks the %s option when it is the current theme', (theme, label) => {
    themeState.theme = theme;
    render(<MobileThemeToggle />);
    expect(screen.getByRole('radio', { name: label })).toBeChecked();
  });

  it('changes the theme when another option is chosen', async () => {
    render(<MobileThemeToggle />);
    await userEvent.click(screen.getByRole('radio', { name: 'Light theme' }));
    expect(themeState.setTheme).toHaveBeenCalledExactlyOnceWith('light');
  });

  it('keeps the theme when the current option is clicked again', async () => {
    render(<MobileThemeToggle />);
    await userEvent.click(screen.getByRole('radio', { name: 'System theme' }));
    expect(themeState.setTheme).not.toHaveBeenCalled();
  });

  it('matches the snapshot', () => {
    themeState.theme = 'dark';
    const { container } = render(<MobileThemeToggle />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
