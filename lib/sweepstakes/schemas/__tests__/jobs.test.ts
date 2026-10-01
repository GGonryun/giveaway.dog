import { describe, it, expect } from 'vitest';
import { sweepstakesJobDataSchema } from '../jobs';

const base = {
  taskId: 'task-1',
  tweetId: '123',
  tweetUrl: 'https://x.com/dog/status/123'
};

const result = {
  totalImported: 10,
  newUsers: 4,
  existingUsers: 6,
  completionsValidated: 9,
  completionsCreated: 1
};

const issuePaths = (input: unknown) => {
  const parsed = sweepstakesJobDataSchema.safeParse(input);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.path.join('.'));
};

describe('sweepstakesJobDataSchema', () => {
  describe('valid input', () => {
    it('accepts the required string fields alone', () => {
      expect(sweepstakesJobDataSchema.parse(base)).toEqual(base);
    });

    it('accepts a full result and an error message', () => {
      const input = { ...base, result, error: 'partial failure' };

      expect(sweepstakesJobDataSchema.parse(input)).toEqual(input);
    });

    it('accepts empty strings and zero counts', () => {
      const input = {
        taskId: '',
        tweetId: '',
        tweetUrl: '',
        result: {
          totalImported: 0,
          newUsers: 0,
          existingUsers: 0,
          completionsValidated: 0,
          completionsCreated: 0
        }
      };

      expect(sweepstakesJobDataSchema.parse(input)).toEqual(input);
    });

    it('does not validate the tweet url format', () => {
      expect(
        sweepstakesJobDataSchema.safeParse({ ...base, tweetUrl: 'not a url' })
          .success
      ).toBe(true);
    });

    it('strips unknown keys', () => {
      expect(
        sweepstakesJobDataSchema.parse({ ...base, extra: true })
      ).not.toHaveProperty('extra');
    });
  });

  describe('invalid input', () => {
    it('requires taskId, tweetId and tweetUrl', () => {
      expect(issuePaths({})).toEqual(['taskId', 'tweetId', 'tweetUrl']);
    });

    it('rejects a numeric tweetId', () => {
      expect(issuePaths({ ...base, tweetId: 123 })).toEqual(['tweetId']);
    });

    it('rejects a result missing any count', () => {
      expect(
        issuePaths({
          ...base,
          result: { totalImported: 1 }
        })
      ).toEqual([
        'result.newUsers',
        'result.existingUsers',
        'result.completionsValidated',
        'result.completionsCreated'
      ]);
    });

    it('rejects numeric strings in result counts', () => {
      expect(
        issuePaths({ ...base, result: { ...result, newUsers: '4' } })
      ).toEqual(['result.newUsers']);
    });

    it('rejects a null result', () => {
      expect(issuePaths({ ...base, result: null })).toEqual(['result']);
    });

    it('rejects a non string error', () => {
      expect(issuePaths({ ...base, error: { message: 'x' } })).toEqual([
        'error'
      ]);
    });
  });
});
