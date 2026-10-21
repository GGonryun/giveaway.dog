import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import verifyEmailDefault, { verifyEmail } from '../verify-email';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { dbUser } from '@giveaway/user-model/testing/fixtures-procedures-user';

type VerifyEmailInput = Parameters<typeof verifyEmail>[0];

const NOW = new Date('2026-10-01T12:00:00.000Z');
const TOKEN = 'plain-token-value';
const HASHED_TOKEN = createHash('sha256').update(TOKEN).digest('hex');
const EMAIL = 'jane@example.com';
const IDENTIFIER = `email-verification:${TEST_USER.id}:${EMAIL}`;

const storedToken = () => ({
  identifier: IDENTIFIER,
  token: HASHED_TOKEN,
  expires: new Date('2026-10-01T12:10:00.000Z')
});

describe('verifyEmail', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('exports the same procedure as the default export', () => {
    expect(verifyEmailDefault).toBe(verifyEmail);
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.verificationToken.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects an invalid email address', async () => {
      const result = await verifyEmail({ token: TOKEN, email: 'nope' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
      expect(prismaMock.verificationToken.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a missing token', async () => {
      const result = await verifyEmail({
        email: EMAIL
      } as unknown as VerifyEmailInput);

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toMatch(
        /^Input validation failed: /
      );
    });
  });

  describe('when the token is valid', () => {
    beforeEach(() => {
      signIn();
      prismaMock.verificationToken.findFirst.mockResolvedValue(storedToken());
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(dbUser({ id: TEST_USER.id }));
      prismaMock.verificationToken.delete.mockResolvedValue(storedToken());
    });

    it('[LINK-001] looks up an unexpired token of the signed-in user by email and sha256 hash', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.verificationToken.findFirst).toHaveBeenCalledWith({
        where: {
          identifier: IDENTIFIER,
          token: HASHED_TOKEN,
          expires: { gt: NOW }
        }
      });
    });

    it('looks for another user that holds the email', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: EMAIL, NOT: { id: TEST_USER.id } }
      });
    });

    it('[LINK-001] sets the email of the signed-in user and marks it verified', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { email: EMAIL, emailVerified: NOW }
      });
    });

    it('deletes the used token after updating the user', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
        where: {
          identifier_token: { identifier: IDENTIFIER, token: HASHED_TOKEN }
        }
      });
      expect(prismaMock.user.update.mock.invocationCallOrder[0]).toBeLessThan(
        prismaMock.verificationToken.delete.mock.invocationCallOrder[0]
      );
    });

    it('returns success with the verified user id', async () => {
      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectOk(result)).toEqual({
        success: true,
        message: 'Email verified successfully',
        userId: TEST_USER.id
      });
    });

    it('[LINK-001] takes the email from another user that has not verified it', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        dbUser({ id: 'user-2', email: EMAIL, emailVerified: null })
      );

      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.user.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'user-2' },
        data: { email: null }
      });
      expect(prismaMock.user.update).toHaveBeenNthCalledWith(2, {
        where: { id: TEST_USER.id },
        data: { email: EMAIL, emailVerified: NOW }
      });
    });

    it('returns CONFLICT and keeps the token when another user has verified the email', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        dbUser({ id: 'user-2', email: EMAIL, emailVerified: NOW })
      );

      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'Email address is already in use'
      );
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.verificationToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the token is invalid, expired or for another user', () => {
    it('returns BAD_REQUEST without touching any user', async () => {
      signIn();
      prismaMock.verificationToken.findFirst.mockResolvedValue(null);

      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Invalid or expired verification token'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.verificationToken.delete).not.toHaveBeenCalled();
    });

    it('[LINK-001] looks up the token of the signed-in user, not of the user that requested it', async () => {
      signIn({ id: 'user-3' });
      prismaMock.verificationToken.findFirst.mockResolvedValue(null);

      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.verificationToken.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          identifier: `email-verification:user-3:${EMAIL}`
        })
      });
    });
  });

  describe('when the database fails', () => {
    beforeEach(() => {
      signIn();
    });

    it('returns INTERNAL_SERVER_ERROR and logs the error', async () => {
      const error = new Error('db offline');
      prismaMock.verificationToken.findFirst.mockRejectedValue(error);

      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to verify email'
      );
      expect(consoleError).toHaveBeenCalledWith(
        'Email verification error:',
        error
      );
    });

    it('wraps a P2025 token delete error as INTERNAL_SERVER_ERROR', async () => {
      prismaMock.verificationToken.findFirst.mockResolvedValue(storedToken());
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(dbUser({ id: TEST_USER.id }));
      prismaMock.verificationToken.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to verify email'
      );
    });
  });
});
