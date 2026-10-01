import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EasterEggLogo } from '../easter-egg-logo';

const defaultLogo = () =>
  screen.getByRole('img', { name: 'Default Team Logo' });

describe('EasterEggLogo', () => {
  it('matches the snapshot before the easter egg is found', () => {
    const { container } = render(<EasterEggLogo />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot after the easter egg is found', async () => {
    const { container } = render(<EasterEggLogo />);
    await userEvent.click(defaultLogo());
    expect(container.firstChild).toMatchSnapshot();
  });
});
