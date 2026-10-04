import { describe, it, expect } from 'vitest';
import { UserSource } from '@giveaway/db-model';
import { ZodError } from 'zod';
import {
  allowedUserSourcesSchema,
  parseUserSourceSchema,
  userSourceSchema
} from '../schemas';
import { ApplicationError } from '@giveaway/util-errors';

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

const issueMessages = (result: { success: boolean; error?: ZodError }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('user source schemas', () => {
  describe('userSourceSchema', () => {
    it('accepts an empty list', () => {
      expect(userSourceSchema.parse([])).toEqual([]);
    });

    it('accepts every user source', () => {
      const all = Object.values(UserSource);

      expect(userSourceSchema.parse(all)).toEqual(all);
    });

    it('accepts duplicate sources', () => {
      expect(userSourceSchema.parse(['SIGNUP', 'SIGNUP'])).toEqual([
        'SIGNUP',
        'SIGNUP'
      ]);
    });

    it('rejects an unknown source', () => {
      expect(userSourceSchema.safeParse(['FACEBOOK_IMPORT']).success).toBe(
        false
      );
    });

    it('rejects lower case source names', () => {
      expect(userSourceSchema.safeParse(['signup']).success).toBe(false);
    });

    it('rejects a non array value', () => {
      expect(userSourceSchema.safeParse('SIGNUP').success).toBe(false);
    });
  });

  describe('allowedUserSourcesSchema', () => {
    it('accepts a single source', () => {
      expect(allowedUserSourcesSchema.parse(['TWITTER_IMPORT'])).toEqual([
        'TWITTER_IMPORT'
      ]);
    });

    it('accepts five sources', () => {
      const five = [
        'SIGNUP',
        'TWITTER_IMPORT',
        'BLUESKY_IMPORT',
        'MANUAL_IMPORT',
        'DISCORD_IMPORT'
      ];

      expect(allowedUserSourcesSchema.safeParse(five).success).toBe(true);
    });

    it('rejects an empty list with the minimum message', () => {
      const result = allowedUserSourcesSchema.safeParse([]);

      expect(result.success).toBe(false);
      expect(issueMessages(result)).toEqual([
        'At least one external source must be selected'
      ]);
    });

    it('rejects more than five sources with the maximum message', () => {
      const result = allowedUserSourcesSchema.safeParse([
        'SIGNUP',
        'TWITTER_IMPORT',
        'BLUESKY_IMPORT',
        'MANUAL_IMPORT',
        'DISCORD_IMPORT',
        'TWITCH_IMPORT'
      ]);

      expect(result.success).toBe(false);
      expect(issueMessages(result)).toEqual([
        'A maximum of 5 external sources are allowed'
      ]);
    });

    it('rejects unknown sources before running the refinements', () => {
      const result = allowedUserSourcesSchema.safeParse(['NOPE']);

      expect(result.success).toBe(false);
      expect(issueMessages(result)).not.toContain(
        'At least one external source must be selected'
      );
    });
  });

  describe('parseUserSourceSchema', () => {
    it.each([null, 0, '', false])(
      'returns null for the falsy value %s',
      (value) => {
        expect(parseUserSourceSchema(value)).toBeNull();
      }
    );

    it('returns the parsed sources for a valid list', () => {
      expect(parseUserSourceSchema(['SIGNUP', 'ANONYMOUS'])).toEqual([
        'SIGNUP',
        'ANONYMOUS'
      ]);
    });

    it('returns an empty list for an empty array', () => {
      expect(parseUserSourceSchema([])).toEqual([]);
    });

    it('returns a parsed copy rather than the input array', () => {
      const input = ['SIGNUP', 'TWITCH_IMPORT'];

      const result = parseUserSourceSchema(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it('throws a VALIDATION_ERROR for an invalid list', () => {
      const error = catchError(() => parseUserSourceSchema(['NOPE']));

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid external platforms format'
      });
    });

    it('attaches the zod error as the cause', () => {
      const error = catchError(() => parseUserSourceSchema({ a: 1 }));

      expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
    });

    it('throws for a truthy non array value', () => {
      expect(() => parseUserSourceSchema('SIGNUP')).toThrow(
        'Invalid external platforms format'
      );
    });
  });
});
