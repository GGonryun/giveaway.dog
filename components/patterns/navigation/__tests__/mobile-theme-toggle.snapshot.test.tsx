import { render } from '@testing-library/react';
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

  it('matches the snapshot', () => {
    themeState.theme = 'dark';
    const { container } = render(<MobileThemeToggle />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
