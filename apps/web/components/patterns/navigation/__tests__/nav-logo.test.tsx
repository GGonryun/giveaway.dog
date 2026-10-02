import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NavLogo } from '../nav-logo';

describe('NavLogo', () => {
  it('links the logo to the home page', () => {
    render(<NavLogo />);
    expect(screen.getByRole('link', { name: /Giveaway\.dog/ })).toHaveAttribute(
      'href',
      '/home'
    );
  });

  it('shows the dog emoji next to the site name', () => {
    render(<NavLogo />);
    const link = screen.getByRole('link');
    expect(within(link).getByRole('img', { name: 'dog face' })).toHaveClass(
      'text-3xl'
    );
    expect(within(link).getByText('Giveaway.dog')).toBeInTheDocument();
  });
});
