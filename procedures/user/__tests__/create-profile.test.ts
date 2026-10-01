import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import createProfile from '../create-profile';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { dbUser } from './fixtures-procedures-user';

type CreateProfileInput = Parameters<typeof createProfile>[0];

describe('createProfile', () => {
  let consoleInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await createProfile({ name: 'Jane' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('rejects a missing name', async () => {
      signIn();

      const result = await createProfile({} as unknown as CreateProfileInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a non-string name', async () => {
      signIn();

      const result = await createProfile({
        name: 7
      } as unknown as CreateProfileInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when a user with the session id already exists', () => {
    it('returns CONFLICT without updating', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(dbUser());

      const result = await createProfile({ name: 'Jane' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'User already exists'
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('looks the user up by the session user id', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(dbUser());

      await createProfile({ name: 'Jane' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_USER.id }
      });
    });
  });

  describe('when no user with the session id exists', () => {
    beforeEach(() => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(null);
    });

    it('updates the session user name', async () => {
      prismaMock.user.update.mockResolvedValue(dbUser({ name: 'Jane' }));

      await createProfile({ name: 'Jane' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { name: 'Jane' }
      });
    });

    it('accepts an empty name', async () => {
      prismaMock.user.update.mockResolvedValue(dbUser({ name: '' }));

      const result = await createProfile({ name: '' });

      expectOk(result);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: '' } })
      );
    });

    it('returns the full updated user record rather than only the id', async () => {
      const updated = dbUser({ name: 'Jane' });
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await createProfile({ name: 'Jane' });

      expect(expectOk(result)).toEqual(updated);
    });

    it('logs the session user', async () => {
      prismaMock.user.update.mockResolvedValue(dbUser());

      await createProfile({ name: 'Jane' });

      expect(consoleInfo).toHaveBeenCalledWith(
        'Creating profile for user:',
        expect.objectContaining({ id: TEST_USER.id })
      );
    });

    it('returns INTERNAL_SERVER_ERROR when the update fails', async () => {
      prismaMock.user.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await createProfile({ name: 'Jane' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to update profile'
      );
    });

    it('fails output validation when the updated record has no id', async () => {
      prismaMock.user.update.mockResolvedValue({ name: 'Jane' });

      const result = await createProfile({ name: 'Jane' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Output validation failed: /
      );
    });
  });

  describe('when the existence check fails', () => {
    it('maps a non-P2025 prisma error to INTERNAL_SERVER_ERROR', async () => {
      signIn();
      prismaMock.user.findUnique.mockRejectedValue(knownRequestError('P1001'));

      const result = await createProfile({ name: 'Jane' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. .*error code: .{6}$/
      );
    });
  });
});
