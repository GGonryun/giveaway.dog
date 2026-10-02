import { render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserAccountType, UserSource } from '@prisma/client';
import type { UserSchema } from '@/schemas/user';
import { UserProvider, useUser } from '../user-provider';

const user: UserSchema = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  emailVerified: true,
  image: null,
  countryCode: 'GB',
  userAgent: 'agent-1',
  birthday: null,
  qualityScore: 80,
  providers: [],
  source: UserSource.SIGNUP,
  username: 'ada',
  onboarded: true,
  accountType: UserAccountType.PARTICIPANT,
  preferredContactMethod: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  isAnonymous: false
};

const UserName = () => {
  const { name, email } = useUser();
  return (
    <p>
      {name} ({email})
    </p>
  );
};

describe('UserProvider', () => {
  describe('when a consumer is rendered inside the provider', () => {
    it('exposes the provided user', () => {
      const { result } = renderHook(() => useUser(), {
        wrapper: ({ children }) => (
          <UserProvider value={user}>{children}</UserProvider>
        )
      });

      expect(result.current).toBe(user);
    });

    it('renders consumers with the user details', () => {
      render(
        <UserProvider value={user}>
          <UserName />
        </UserProvider>
      );

      expect(
        screen.getByText('Ada Lovelace (ada@example.com)')
      ).toBeInTheDocument();
    });

    it('updates consumers when the user changes', () => {
      const { rerender } = render(
        <UserProvider value={user}>
          <UserName />
        </UserProvider>
      );

      rerender(
        <UserProvider value={{ ...user, name: 'Grace Hopper' }}>
          <UserName />
        </UserProvider>
      );

      expect(
        screen.getByText('Grace Hopper (ada@example.com)')
      ).toBeInTheDocument();
    });
  });

  describe('when useUser is called outside the provider', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('throws a descriptive error', () => {
      expect(() => renderHook(() => useUser())).toThrow(
        'useUser must be used within <UserProvider>'
      );
    });
  });
});
