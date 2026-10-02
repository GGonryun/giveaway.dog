import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';
import verifyEmailDefault, { verifyEmail } from '../verify-email';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { dbUser } from './fixtures-procedures-user';

type VerifyEmailInput = Parameters<typeof verifyEmail>[0];

const NOW = new Date('2026-10-01T12:00:00.000Z');
const TOKEN = 'plain-token-value';
const HASHED_TOKEN = createHash('sha256').update(TOKEN).digest('hex');
const EMAIL = 'jane@example.com';

const storedToken = () => ({
  identifier: EMAIL,
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

  describe('input validation', () => {
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
      prismaMock.verificationToken.findFirst.mockResolvedValue(storedToken());
      prismaMock.user.findFirst.mockResolvedValue(
        dbUser({ id: 'user-2', email: EMAIL })
      );
      prismaMock.user.update.mockResolvedValue(dbUser({ id: 'user-2' }));
      prismaMock.verificationToken.delete.mockResolvedValue(storedToken());
    });

    it('does not require the caller to be signed in', async () => {
      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expectOk(result);
    });

    it('looks up an unexpired token by email and sha256 hash of the token', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.verificationToken.findFirst).toHaveBeenCalledWith({
        where: {
          identifier: EMAIL,
          token: HASHED_TOKEN,
          expires: { gt: NOW }
        }
      });
    });

    it('looks up the user that owns the email', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: EMAIL }
      });
    });

    it('marks the email as verified at the current time', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { emailVerified: NOW }
      });
    });

    it('deletes the used token after verifying the user', async () => {
      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
        where: {
          identifier_token: { identifier: EMAIL, token: HASHED_TOKEN }
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
        userId: 'user-2'
      });
    });

    it('verifies the user that owns the email even when someone else is signed in', async () => {
      signIn();

      await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-2' } })
      );
    });
  });

  describe('when the token is invalid or expired', () => {
    it('returns BAD_REQUEST without touching the user', async () => {
      prismaMock.verificationToken.findFirst.mockResolvedValue(null);

      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'BAD_REQUEST').message).toBe(
        'Invalid or expired verification token'
      );
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.verificationToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('when no user has the email', () => {
    it('returns NOT_FOUND and keeps the token', async () => {
      prismaMock.verificationToken.findFirst.mockResolvedValue(storedToken());
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('User not found');
      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.verificationToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
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

    it('wraps a P2025 token delete error as INTERNAL_SERVER_ERROR after the user was verified', async () => {
      prismaMock.verificationToken.findFirst.mockResolvedValue(storedToken());
      prismaMock.user.findFirst.mockResolvedValue(dbUser({ id: 'user-2' }));
      prismaMock.user.update.mockResolvedValue(dbUser({ id: 'user-2' }));
      prismaMock.verificationToken.delete.mockRejectedValue(
        knownRequestError('P2025')
      );

      const result = await verifyEmail({ token: TOKEN, email: EMAIL });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to verify email'
      );
      expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    });
  });
});
