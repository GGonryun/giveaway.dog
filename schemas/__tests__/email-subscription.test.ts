import { describe, it, expect } from 'vitest';
import { emailSubscriptionSchema } from '../email-subscription';

const messagesFor = (email: unknown) => {
  const result = emailSubscriptionSchema.safeParse({ email });
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

describe('emailSubscriptionSchema', () => {
  describe('when the email is valid', () => {
    it('returns the email unchanged', () => {
      expect(
        emailSubscriptionSchema.parse({ email: 'Fan@Example.com' })
      ).toEqual({ email: 'Fan@Example.com' });
    });

    it('strips unknown keys', () => {
      expect(
        emailSubscriptionSchema.parse({ email: 'fan@example.com', name: 'x' })
      ).toEqual({ email: 'fan@example.com' });
    });
  });

  describe('when the email is empty', () => {
    it('reports the required, format and validity errors together', () => {
      expect(messagesFor('')).toEqual([
        'Email is required',
        'Please enter a valid email address',
        'Please use a valid email address'
      ]);
    });
  });

  describe('when the email is malformed', () => {
    it('reports both the format and validity errors', () => {
      expect(messagesFor('not-an-email')).toEqual([
        'Please enter a valid email address',
        'Please use a valid email address'
      ]);
    });
  });

  describe('when the email uses a disposable domain', () => {
    it.each(['someone@mailinator.com', 'someone@YOPMAIL.com'])(
      'rejects %s with the validity message only',
      (email) => {
        expect(messagesFor(email)).toEqual([
          'Please use a valid email address'
        ]);
      }
    );
  });

  describe('when the email is missing', () => {
    it('rejects a missing email', () => {
      expect(emailSubscriptionSchema.safeParse({}).success).toBe(false);
    });

    it('rejects a non-string email', () => {
      expect(messagesFor(42)).toEqual(['Expected string, received number']);
    });
  });
});
