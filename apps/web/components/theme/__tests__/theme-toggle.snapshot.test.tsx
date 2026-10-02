import { render } from '@testing-library/react';
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

  it('matches the snapshot', () => {
    themeState.theme = 'dark';
    const { container } = render(<ThemeToggle />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
