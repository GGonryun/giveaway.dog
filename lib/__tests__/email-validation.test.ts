import { describe, it, expect } from 'vitest';
import { isValidEmail } from '../email-validation';

const DISPOSABLE_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'fakeinbox.com',
  'yopmail.com',
  'temp-mail.org',
  'getnada.com',
  'trashmail.com',
  'maildrop.cc',
  'sharklasers.com',
  'guerrillamailblock.com',
  'spam4.me',
  'grr.la',
  'discard.email'
];

describe('isValidEmail', () => {
  describe('when the email is valid', () => {
    it.each([
      'user@example.com',
      'first.last+tag@sub.example.co.uk',
      'a@b.co',
      'user_name-1@example-domain.io'
    ])('accepts %s', (email) => {
      expect(isValidEmail(email)).toBe(true);
    });

    it('trims surrounding whitespace before validating', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });

    it('ignores letter case', () => {
      expect(isValidEmail('User@Example.COM')).toBe(true);
    });

    it('accepts an email of exactly 254 characters', () => {
      const email = `${'a'.repeat(242)}@example.com`;

      expect(email).toHaveLength(254);
      expect(isValidEmail(email)).toBe(true);
    });

    it('accepts subdomains of disposable domains', () => {
      expect(isValidEmail('user@mail.mailinator.com')).toBe(true);
    });
  });

  describe('when the input is missing or not a string', () => {
    it('rejects an empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it.each([null, undefined, 42, {}, []])('rejects %s', (value) => {
      expect(isValidEmail(value as unknown as string)).toBe(false);
    });
  });

  describe('when the length is out of bounds', () => {
    it('rejects a whitespace only string', () => {
      expect(isValidEmail('     ')).toBe(false);
    });

    it('rejects strings shorter than 3 characters after trimming', () => {
      expect(isValidEmail(' a@ ')).toBe(false);
    });

    it('rejects an email longer than 254 characters', () => {
      const email = `${'a'.repeat(243)}@example.com`;

      expect(email).toHaveLength(255);
      expect(isValidEmail(email)).toBe(false);
    });
  });

  describe('when the format is invalid', () => {
    it.each([
      'plainaddress',
      'missing-at.example.com',
      '@example.com',
      'user@',
      'user@example',
      'user@@example.com',
      'us er@example.com',
      'user@exa mple.com'
    ])('rejects %s', (email) => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  describe('when the domain is disposable', () => {
    it.each(DISPOSABLE_DOMAINS)('rejects addresses at %s', (domain) => {
      expect(isValidEmail(`someone@${domain}`)).toBe(false);
    });

    it('rejects disposable domains regardless of case', () => {
      expect(isValidEmail('someone@MAILINATOR.com')).toBe(false);
    });
  });

  describe('when the domain is malformed', () => {
    it('rejects consecutive dots in the domain', () => {
      expect(isValidEmail('user@example..com')).toBe(false);
    });

    it('rejects a domain starting with a dot', () => {
      expect(isValidEmail('user@.example.com')).toBe(false);
    });

    it('rejects a domain ending with a dot', () => {
      expect(isValidEmail('user@example.com.')).toBe(false);
    });

    it('allows consecutive dots in the local part', () => {
      expect(isValidEmail('first..last@example.com')).toBe(true);
    });
  });
});
