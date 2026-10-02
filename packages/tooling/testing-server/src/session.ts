import { vi } from 'vitest';
import type { UserAccountType } from '@prisma/client';

export type TestSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  provider?: string;
  onboarded?: boolean;
  accountType?: UserAccountType;
  username?: string | null;
};

export type TestSession = {
  user: TestSessionUser;
  expires: string;
};

export const TEST_USER = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://example.com/avatar.png',
  username: 'testuser',
  onboarded: true,
  accountType: 'HOST'
} satisfies TestSessionUser;

export const authMock = vi.fn<() => Promise<TestSession | null>>();

export const createSession = (
  user: Partial<TestSessionUser> = {},
  expires = '2999-01-01T00:00:00.000Z'
): TestSession => ({
  user: { ...TEST_USER, ...user },
  expires
});

export const signIn = (user: Partial<TestSessionUser> = {}) => {
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
