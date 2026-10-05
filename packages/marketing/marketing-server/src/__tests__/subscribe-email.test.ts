import { describe, it, expect } from 'vitest';
import subscribeEmail from '../subscribe-email';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn } from '@giveaway/testing-server/session';
import { nextCacheMock } from '@giveaway/testing-server/next-cache';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';

type Input = Parameters<typeof subscribeEmail>[0];

describe('subscribeEmail', () => {
  describe('when the email is valid', () => {
    it('returns success for an anonymous caller', async () => {
      prismaMock.emailSubscription.upsert.mockResolvedValue({});

      const result = await subscribeEmail({ email: 'fan@example.com' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('upserts the subscription keyed by email without updating existing rows', async () => {
      prismaMock.emailSubscription.upsert.mockResolvedValue({});

      await subscribeEmail({ email: 'fan@example.com' });

      expect(prismaMock.emailSubscription.upsert).toHaveBeenCalledWith({
        where: { email: 'fan@example.com' },
        create: { email: 'fan@example.com' },
        update: {}
      });
    });

    it('lowercases the email before storing it', async () => {
      prismaMock.emailSubscription.upsert.mockResolvedValue({});

      await subscribeEmail({ email: 'Fan.Person@Example.COM' });

      expect(prismaMock.emailSubscription.upsert).toHaveBeenCalledWith({
        where: { email: 'fan.person@example.com' },
        create: { email: 'fan.person@example.com' },
        update: {}
      });
    });

    it('returns success when the email is already subscribed', async () => {
      prismaMock.emailSubscription.upsert.mockResolvedValue({
        id: 'existing',
        email: 'fan@example.com'
      });

      const result = await subscribeEmail({ email: 'fan@example.com' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('subscribes signed in callers the same way', async () => {
      signIn();
      prismaMock.emailSubscription.upsert.mockResolvedValue({});

      const result = await subscribeEmail({ email: 'fan@example.com' });

      expect(expectOk(result)).toEqual({ success: true });
    });

    it('does not revalidate any cache tags', async () => {
      prismaMock.emailSubscription.upsert.mockResolvedValue({});

      await subscribeEmail({ email: 'fan@example.com' });

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when the email is invalid', () => {
    it('rejects an empty email with the required message', async () => {
      const result = await subscribeEmail({ email: '' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Email is required'
      );
      expect(prismaMock.emailSubscription.upsert).not.toHaveBeenCalled();
    });

    it('rejects a malformed email with the format message', async () => {
      const result = await subscribeEmail({ email: 'not-an-email' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Please enter a valid email address'
      );
      expect(prismaMock.emailSubscription.upsert).not.toHaveBeenCalled();
    });

    it('rejects a disposable email domain at input validation, before the handler check', async () => {
      const result = await subscribeEmail({ email: 'fan@mailinator.com' });

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toContain('Input validation failed');
      expect(failure.message).toContain('Please use a valid email address');
      expect(failure.message).not.toContain(
        'Please provide a valid email address'
      );
      expect(prismaMock.emailSubscription.upsert).not.toHaveBeenCalled();
    });

    it('rejects a disposable domain regardless of letter case', async () => {
      const result = await subscribeEmail({ email: 'Fan@YopMail.com' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Please use a valid email address'
      );
    });

    it('rejects an email with surrounding whitespace', async () => {
      const result = await subscribeEmail({ email: ' fan@example.com ' });

      expect(expectFailure(result, 'UNPROCESSABLE_CONTENT').message).toContain(
        'Please enter a valid email address'
      );
      expect(prismaMock.emailSubscription.upsert).not.toHaveBeenCalled();
    });

    it('rejects a missing email field', async () => {
      const result = await subscribeEmail({} as unknown as Input);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.emailSubscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    it('returns INTERNAL_SERVER_ERROR for a prisma known request error', async () => {
      prismaMock.emailSubscription.upsert.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await subscribeEmail({ email: 'fan@example.com' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        /^We f\*\*\*\*d up\. Try again or contact giveaway\.dog support staff and provide the following error code: .{6}$/
      );
    });
  });
});
