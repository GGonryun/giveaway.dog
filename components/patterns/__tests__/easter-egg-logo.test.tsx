import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { EasterEggLogo } from '../easter-egg-logo';

const defaultLogo = () =>
  screen.getByRole('img', { name: 'Default Team Logo' });

describe('EasterEggLogo', () => {
  it('shows the default team logo at three quarters of the size', () => {
    render(<EasterEggLogo />);
    expect(defaultLogo()).toHaveAttribute('width', '150');
    expect(defaultLogo()).toHaveAttribute('height', '150');
    expect(
      screen.queryByRole('img', { name: 'Easter Egg' })
    ).not.toBeInTheDocument();
  });

  it.each([
    [100, '75'],
    [99, '74']
  ])('rounds the logo size down for a size of %i', (size, expectedLogoSize) => {
    render(<EasterEggLogo size={size} />);
    expect(defaultLogo()).toHaveAttribute('width', expectedLogoSize);
  });

  it('reveals the easter egg at the full size when the logo is clicked', async () => {
    render(<EasterEggLogo size={120} />);
    await userEvent.click(defaultLogo());
    const easterEgg = screen.getByRole('img', { name: 'Easter Egg' });
    expect(easterEgg).toHaveAttribute('width', '120');
    expect(easterEgg.getAttribute('src')).toContain('url=%2Ftaki.png');
    expect(
      screen.queryByRole('img', { name: 'Default Team Logo' })
    ).not.toBeInTheDocument();
  });

  it('keeps the easter egg visible once it has been found', async () => {
    render(<EasterEggLogo />);
    await userEvent.click(defaultLogo());
    await userEvent.click(screen.getByRole('img', { name: 'Easter Egg' }));
    expect(screen.getByRole('img', { name: 'Easter Egg' })).toBeInTheDocument();
  });
});
