import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NO_REPLY_EMAIL } from '@giveaway/email/client';
import updateEmailDefault, { updateEmail } from '../update-email';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { dbUser } from '@giveaway/user-model/testing/fixtures-procedures-user';

const inbound = vi.hoisted(() => ({
  send: vi.fn()
}));

vi.mock('inboundemail', () => ({
  default: class {
    emails = { send: inbound.send };
  }
}));

type UpdateEmailInput = Parameters<typeof updateEmail>[0];

const sentParams = () => {
  const match = inbound.send.mock.calls[0][0].text.match(/\/portal\?(\S*)/);
  return new URLSearchParams(match?.[1]);
};

describe('updateEmail', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    inbound.send.mockReset();
    inbound.send.mockResolvedValue({ id: 'email-1' });
    prismaMock.verificationToken.create.mockResolvedValue({});
    vi.stubEnv('INBOUND_SECRET', 'inbound-secret');
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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

  describe('when another user has verified the email', () => {
    it('returns CONFLICT without sending a verification', async () => {
      signIn();
      prismaMock.user.findFirst.mockResolvedValue(
        dbUser({ id: 'user-9', email: 'new@example.com' })
      );

      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'Email address is already in use'
      );
      expect(prismaMock.verificationToken.create).not.toHaveBeenCalled();
      expect(inbound.send).not.toHaveBeenCalled();
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
    });

    it('looks only for other users that have verified the email', async () => {
      await updateEmail({ email: 'new@example.com' });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'new@example.com',
          emailVerified: { not: null },
          NOT: { id: TEST_USER.id }
        }
      });
    });

    it('[LINK-001] does not change the email before the new address is verified', async () => {
      await updateEmail({ email: 'new@example.com' });

      expect(prismaMock.user.update).not.toHaveBeenCalled();
      expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
    });

    it('sends a verification link for the signed-in user to the new address', async () => {
      await updateEmail({
        email: 'new@example.com',
        redirectTo: '/account'
      });

      expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: `email-verification:${TEST_USER.id}:new@example.com`
        })
      });
      expect(inbound.send).toHaveBeenCalledWith(
        expect.objectContaining({ from: NO_REPLY_EMAIL, to: 'new@example.com' })
      );
      expect(sentParams().get('email')).toBe('new@example.com');
      expect(sentParams().get('redirectTo')).toBe('/account');
    });

    it('returns a success message', async () => {
      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectOk(result)).toEqual({
        success: true,
        message: 'Verification email sent to the new address'
      });
    });

    it('does not revalidate any cache tags', async () => {
      await updateEmail({ email: 'new@example.com' });

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when something fails', () => {
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

    it('returns INTERNAL_SERVER_ERROR when the email cannot be sent', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      inbound.send.mockRejectedValue(new Error('provider down'));

      const result = await updateEmail({ email: 'new@example.com' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'Failed to update email address'
      );
    });
  });
});
