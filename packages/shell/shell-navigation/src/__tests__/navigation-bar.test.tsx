import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserSchema } from '@giveaway/user-model/user';
import { NavigationBar } from '../navigation-bar';

vi.mock('../logged-in-navigation-bar', () => ({
  LoggedInNavigationBar: ({ user }: { user: UserSchema }) => (
    <nav aria-label="Signed in navigation">{user.email}</nav>
  )
}));

vi.mock('../logged-out-navigation-bar', () => ({
  LoggedOutNavigationBar: () => <nav aria-label="Signed out navigation" />
}));

const user: UserSchema = {
  id: 'user-1',
  name: 'Ada',
  email: 'ada@example.com',
  emailVerified: true,
  image: null,
  countryCode: null,
  userAgent: null,
  birthday: null,
  qualityScore: 0,
  providers: [],
  source: 'SIGNUP',
  preferredContactMethod: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  isAnonymous: false
};

describe('NavigationBar', () => {
  it('shows the signed out navigation when there is no user', () => {
    render(<NavigationBar user={null} />);
    expect(
      screen.getByRole('navigation', { name: 'Signed out navigation' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Signed in navigation' })
    ).not.toBeInTheDocument();
  });

  it('shows the signed in navigation for the current user', () => {
    render(<NavigationBar user={user} />);
    expect(
      screen.getByRole('navigation', { name: 'Signed in navigation' })
    ).toHaveTextContent('ada@example.com');
    expect(
      screen.queryByRole('navigation', { name: 'Signed out navigation' })
    ).not.toBeInTheDocument();
  });

  it('treats a user without an id as signed out', () => {
    render(<NavigationBar user={{ ...user, id: '' }} />);
    expect(
      screen.getByRole('navigation', { name: 'Signed out navigation' })
    ).toBeInTheDocument();
  });
});
