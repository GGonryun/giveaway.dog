import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import updateEmailDefault, { updateEmail } from '../update-email';
import { prismaMock, knownRequestError } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { nextCacheMock } from '@/test/next-cache';
import { dbUser } from './fixtures-procedures-user';

type UpdateEmailInput = Parameters<typeof updateEmail>[0];

describe('updateEmail', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports the same procedure as the default export', () => {
    expect(updateEmailDefault).toBe(updateEmail);
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    it('rejects an invalid email address', async () => {
      signIn();

      const result = await updateEmail({ email: 'not-an-email' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a missing email', async () => {
      signIn();

      const result = await updateEmail({} as unknown as UpdateEmailInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when another user already has the email', () => {
    it('returns CONFLICT without updating', async () => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(
        dbUser({ id: 'user-9', email: 'new@example.com' })
      );

      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'Email address is already in use'
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalledWith(
        'Email update error:',
        expect.anything()
      );
    });
  });

  describe('when the email is available', () => {
    beforeEach(() => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(
        dbUser({ email: 'new@example.com' })
      );
    });

    it('looks for other users with the same email', async () => {
      await updateEmail({ email: 'new@example.com' });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'new@example.com', NOT: { id: TEST_USER.id } }
      });
    });

    it('stores the new email and resets the verification status', async () => {
      await updateEmail({ email: 'new@example.com' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { email: 'new@example.com', emailVerified: null }
      });
    });

    it('returns a success message', async () => {
      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectOk(result)).toEqual({
        success: true,
        message: 'Email updated successfully'
      });
    });

    it('does not revalidate any cache tags', async () => {
      await updateEmail({ email: 'new@example.com' });

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns INTERNAL_SERVER_ERROR and logs when the lookup fails', async () => {
      const error = new Error('db offline');
      prismaMock.user.findFirst.mockRejectedValue(error);

      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to update email address'
      );
      expect(consoleError).toHaveBeenCalledWith('Email update error:', error);
    });

    it('wraps a P2025 update error as INTERNAL_SERVER_ERROR', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to update email address'
      );
    });
  });
});
