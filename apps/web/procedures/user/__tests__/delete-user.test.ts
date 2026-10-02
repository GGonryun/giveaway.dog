import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import deleteUser from '../delete-user';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

const nextAuth = vi.hoisted(() => ({
  signOut: vi.fn(),
  signIn: vi.fn(),
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() }
}));

vi.mock('@/lib/auth/config', () => nextAuth);

const redirectError = () =>
  Object.assign(new Error('NEXT_REDIRECT'), {
    digest: 'NEXT_REDIRECT;replace;/;307;'
  });

describe('deleteUser', () => {
  beforeEach(() => {
    nextAuth.signOut.mockReset();
    nextAuth.signOut.mockResolvedValue(undefined);
    prismaMock.user.deleteMany.mockResolvedValue({ count: 1 });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers without deleting or signing out', async () => {
      const result = await deleteUser();

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.deleteMany).not.toHaveBeenCalled();
      expect(nextAuth.signOut).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('deletes the session user', async () => {
      await deleteUser();

      expect(prismaMock.user.deleteMany).toHaveBeenCalledWith({
        where: { id: TEST_USER.id }
      });
    });

    it('signs the user out and redirects to the home page', async () => {
      await deleteUser();

      expect(nextAuth.signOut).toHaveBeenCalledWith({ redirectTo: '/' });
    });

    it('deletes the user before signing out', async () => {
      await deleteUser();

      expect(
        prismaMock.user.deleteMany.mock.invocationCallOrder[0]
      ).toBeLessThan(nextAuth.signOut.mock.invocationCallOrder[0]);
    });

    it('returns an ok result with no data when sign out does not redirect', async () => {
      const result = await deleteUser();

      expect(expectOk(result)).toBeUndefined();
    });

    it('rethrows the redirect raised by sign out', async () => {
      const error = redirectError();
      nextAuth.signOut.mockRejectedValue(error);

      await expect(deleteUser()).rejects.toBe(error);
    });

    it('returns INTERNAL_SERVER_ERROR when sign out fails without redirecting', async () => {
      nextAuth.signOut.mockRejectedValue(new Error('session store down'));

      const result = await deleteUser();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'session store down'
      );
    });

    it('does not sign out when the delete fails', async () => {
      prismaMock.user.deleteMany.mockRejectedValue(new Error('db offline'));

      const result = await deleteUser();

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db offline'
      );
      expect(nextAuth.signOut).not.toHaveBeenCalled();
    });
  });
});
