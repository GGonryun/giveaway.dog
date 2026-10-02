import { vi } from 'vitest';
import type { Session } from 'next-auth';

export const TEST_USER = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.png',
  username: 'testuser',
  onboarded: true,
  accountType: 'HOST'
} satisfies Session['user'];

export const authMock = vi.fn<() => Promise<Session | null>>();

export const createSession = (
  user: Partial<Session['user']> = {},
  expires = '2999-01-01T00:00:00.000Z'
): Session => ({
  user: { ...TEST_USER, ...user },
  expires
});

export const signIn = (user: Partial<Session['user']> = {}) => {
  const session = createSession(user);
  authMock.mockResolvedValue(session);
  return session;
};

export const signOut = () => {
  authMock.mockResolvedValue(null);
};

export const resetAuthMock = () => {
  authMock.mockReset();
  authMock.mockResolvedValue(null);
};
