import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
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

  it.each(['light', 'dark', 'system'])(
    'hydrates the %s theme without a mismatch, then checks its option',
    async (theme) => {
      themeState.theme = theme;
      const html = renderToString(<ThemeToggle />);
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      const onRecoverableError = vi.fn();

      const root = await act(async () =>
        hydrateRoot(container, <ThemeToggle />, { onRecoverableError })
      );
      onTestFinished(() => {
        act(() => root.unmount());
        container.remove();
      });

      expect(html).not.toContain('aria-checked="true"');
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(
        container.querySelector(`[role="radio"][value="${theme}"]`)
      ).toHaveAttribute('aria-checked', 'true');
    }
  );

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
