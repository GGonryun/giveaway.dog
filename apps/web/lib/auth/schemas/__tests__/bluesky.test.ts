import { describe, it, expect } from 'vitest';
import { blueskyLoginFormSchema } from '../bluesky';

const FORMAT_MESSAGE =
  'Invalid Bluesky handle format. Must be a valid domain (e.g., username.bsky.social)';

const messagesFor = (input: unknown) => {
  const result = blueskyLoginFormSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('blueskyLoginFormSchema', () => {
  describe('when the handle is valid', () => {
    it.each([
      'alice.bsky.social',
      'Alice.Bsky.Social',
      'alice.example.com',
      'a-b.c',
      'x1.y2'
    ])('accepts %s', (handle) => {
      expect(blueskyLoginFormSchema.parse({ blueskyHandle: handle })).toEqual({
        blueskyHandle: handle
      });
    });

    it('strips unknown keys', () => {
      expect(
        blueskyLoginFormSchema.parse({
          blueskyHandle: 'alice.bsky.social',
          extra: true
        })
      ).toEqual({ blueskyHandle: 'alice.bsky.social' });
    });

    it('accepts a label of exactly 63 characters', () => {
      const handle = `${'a'.repeat(63)}.bsky.social`;

      expect(
        blueskyLoginFormSchema.safeParse({ blueskyHandle: handle }).success
      ).toBe(true);
    });
  });

  describe('when the handle is invalid', () => {
    it('reports both the required and format messages for an empty handle', () => {
      expect(messagesFor({ blueskyHandle: '' })).toEqual([
        'Bluesky handle is required',
        FORMAT_MESSAGE
      ]);
    });

    it.each([
      'alice',
      '@alice.bsky.social',
      '-alice.bsky.social',
      'alice-.bsky.social',
      'alice..bsky.social',
      'alice.bsky.social.',
      'alice_b.bsky.social',
      'alice bsky.social'
    ])('rejects %s with the format message', (handle) => {
      expect(messagesFor({ blueskyHandle: handle })).toEqual([FORMAT_MESSAGE]);
    });

    it('rejects a label longer than 63 characters', () => {
      const handle = `${'a'.repeat(64)}.bsky.social`;

      expect(messagesFor({ blueskyHandle: handle })).toEqual([FORMAT_MESSAGE]);
    });

    it('rejects a missing handle as required', () => {
      expect(messagesFor({})).toEqual(['Required']);
    });

    it('rejects a non-string handle', () => {
      const result = blueskyLoginFormSchema.safeParse({ blueskyHandle: 42 });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.code).toBe('invalid_type');
    });
  });
});
