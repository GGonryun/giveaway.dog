import { describe, it, expect } from 'vitest';
import findUser from '../find-user';
import { prismaMock } from '@giveaway/testing-server/prisma';
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

type FindUserInput = Parameters<typeof findUser>[0];

describe('findUser', () => {
  describe('when the caller is not signed in', () => {
    it('returns null without querying the database', async () => {
      const result = await findUser({ userId: 'user-2' });

      expect(expectOk(result)).toBeNull();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('treats an expired session as signed out', async () => {
      authMock.mockResolvedValue(createSession({}, '2000-01-01T00:00:00.000Z'));

      const result = await findUser({ self: true });

      expect(expectOk(result)).toBeNull();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('treats a session without a user id as signed out', async () => {
      authMock.mockResolvedValue(createSession({ id: '' }));

      const result = await findUser({ self: true });

      expect(expectOk(result)).toBeNull();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('still validates the input', async () => {
      const result = await findUser({} as unknown as FindUserInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when the caller is signed in', () => {
    it('looks up the session user when self is requested', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(userRow());

      await findUser({ self: true });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        userSelectArgs(TEST_USER.id)
      );
    });

    it('looks up the requested user id', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(userRow());

      await findUser({ userId: 'user-2' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        userSelectArgs('user-2')
      );
    });

    it('returns the mapped user', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(userRow());

      const result = await findUser({ userId: 'user-2' });

      expect(expectOk(result)).toEqual(mappedUser());
    });

    it('returns null when the user does not exist', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await findUser({ userId: 'missing' });

      expect(expectOk(result)).toBeNull();
    });

    it('rejects self set to false', async () => {
      signIn();

      const result = await findUser({
        self: false
      } as unknown as FindUserInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('maps a database error to INTERNAL_SERVER_ERROR with its message', async () => {
      signIn();
      prismaMock.user.findUnique.mockRejectedValue(new Error('db offline'));

      const result = await findUser({ self: true });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'db offline'
      );
    });
  });
});
