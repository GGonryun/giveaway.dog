import { describe, expect, it } from 'vitest';
import { loginEmailSchema } from '../email';

describe('loginEmailSchema', () => {
  it('[AUTH-011] accepts an email address', () => {
    expect(loginEmailSchema.parse('ada@example.com')).toBe('ada@example.com');
  });

  it('trims the spaces around the address', () => {
    expect(loginEmailSchema.parse('  ada@example.com ')).toBe(
      'ada@example.com'
    );
  });

  it.each(['not-an-email', '', '   ', 'ada@', '@example.com', 'a b@c.com'])(
    '[AUTH-011] refuses %j with the invalid email message',
    (email) => {
      const result = loginEmailSchema.safeParse(email);

      expect(result.success).toBe(false);
      expect(result.error?.issues.map((issue) => issue.message)).toEqual([
        'Please enter a valid email address.'
      ]);
    }
  );
});
