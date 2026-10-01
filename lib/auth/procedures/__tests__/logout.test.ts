import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logout from '../logout';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock('@/lib/auth/config', () => ({
  signIn: vi.fn(),
  signOut: mocks.signOut,
  auth: vi.fn(),
  handlers: {}
}));

beforeEach(() => {
  mocks.signOut.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logout', () => {
  describe('when the caller is signed out', () => {
    it('returns UNAUTHORIZED without signing out', async () => {
      const result = await logout('/');

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(mocks.signOut).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    beforeEach(() => {
      signIn();
    });

    it('signs out and redirects to the given path', async () => {
      await logout('/goodbye');

      expect(mocks.signOut).toHaveBeenCalledWith({ redirectTo: '/goodbye' });
    });

    it('returns the sign out result as data', async () => {
      mocks.signOut.mockResolvedValue({ url: '/goodbye' });

      const result = await logout('/goodbye');

      expect(expectOk(result)).toEqual({ url: '/goodbye' });
    });

    it('accepts an empty redirect path', async () => {
      await logout('');

      expect(mocks.signOut).toHaveBeenCalledWith({ redirectTo: '' });
    });

    it('rejects a non-string redirect path', async () => {
      const result = await logout(42 as unknown as string);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(mocks.signOut).not.toHaveBeenCalled();
    });

    it('re-throws the redirect thrown by signOut', async () => {
      const redirect = Object.assign(new Error('NEXT_REDIRECT'), {
        digest: 'NEXT_REDIRECT;replace;/goodbye;307;'
      });
      mocks.signOut.mockRejectedValue(redirect);

      await expect(logout('/goodbye')).rejects.toBe(redirect);
    });

    it('maps a sign out error to INTERNAL_SERVER_ERROR', async () => {
      mocks.signOut.mockRejectedValue(new Error('cookie store locked'));

      const result = await logout('/');

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'cookie store locked'
      );
    });
  });
});
