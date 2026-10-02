import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getUser from '../get-user';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import {
  authMock,
  createSession,
  signIn,
  TEST_USER
} from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  mappedUser,
  userRow,
  userSelectArgs
} from './fixtures-procedures-user';

type GetUserInput = Parameters<typeof getUser>[0];

describe('getUser', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await getUser({ self: true });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects an expired session', async () => {
      authMock.mockResolvedValue(createSession({}, '2000-01-01T00:00:00.000Z'));

      const result = await getUser({ self: true });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects input with neither a user id nor self', async () => {
      const result = await getUser({} as unknown as GetUserInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects self set to false', async () => {
      const result = await getUser({ self: false } as unknown as GetUserInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });

    it('rejects a non-string user id', async () => {
      const result = await getUser({ userId: 42 } as unknown as GetUserInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when the user exists', () => {
    beforeEach(() => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(userRow());
    });

    it('looks up the session user when self is requested', async () => {
      await getUser({ self: true });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        userSelectArgs(TEST_USER.id)
      );
    });

    it('looks up the requested user id', async () => {
      await getUser({ userId: 'user-2' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        userSelectArgs('user-2')
      );
    });

    it('prefers the user id when the input has both a user id and self', async () => {
      await getUser({
        userId: 'user-2',
        self: true
      } as unknown as GetUserInput);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        userSelectArgs('user-2')
      );
    });

    it('returns the mapped user', async () => {
      const result = await getUser({ userId: 'user-2' });

      expect(expectOk(result)).toEqual(mappedUser());
    });
  });

  describe('when the user does not exist', () => {
    it('returns NOT_FOUND', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await getUser({ userId: 'missing' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('User not found');
    });
  });

  describe('when the mapped user fails output validation', () => {
    it('returns UNPROCESSABLE_CONTENT for an invalid stored email', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(
        userRow({ email: 'not-an-email' })
      );

      const result = await getUser({ userId: 'user-2' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });

  describe('when the database fails', () => {
    beforeEach(() => {
      signIn();
    });

    it('maps a P2025 error to NOT_FOUND', async () => {
      prismaMock.user.findUnique.mockRejectedValue(knownRequestError('P2025'));

      const result = await getUser({ userId: 'user-2' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });

    it('maps other errors to INTERNAL_SERVER_ERROR with their message', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('db offline'));

      const result = await getUser({ userId: 'user-2' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db offline'
      );
    });
  });
});
