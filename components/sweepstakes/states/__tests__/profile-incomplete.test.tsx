import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileIncomplete } from '../profile-incomplete';

describe('ProfileIncomplete', () => {
  it('asks the user to complete their profile', () => {
    render(<ProfileIncomplete />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Complete Your Profile' })
    ).toBeInTheDocument();
    expect(screen.getByText('Profile Setup Required')).toBeInTheDocument();
  });

  it('links the call to action to the account page', () => {
    render(<ProfileIncomplete />);
    const button = screen.getByRole('button', { name: 'Complete Profile' });
    expect(button.closest('a')).toHaveAttribute('href', '/account');
  });
});
