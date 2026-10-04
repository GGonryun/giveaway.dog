import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ZodError } from 'zod';
import {
  extractTweetIdFromUrl,
  publishTwitterV2PickerInputSchema,
  twitterV2PickerFormSchema,
  twitterV2PickerUnvalidatedFormSchema
} from '../form';
import { xStatusRefineError } from '@giveaway/x-model/twitter';
import { MAX_PICKER_SCHEDULE_DAYS } from '@giveaway/app-config/settings';

const NOW = new Date('2025-06-15T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

const validUrl = 'https://x.com/doglover/status/1111';

const minimalForm = (overrides: Record<string, unknown> = {}) => ({
  setup: { postUrls: [{ url: validUrl }] },
  actions: {},
  winners: {},
  filters: {},
  ...overrides
});

const withUrls = (...urls: string[]) =>
  minimalForm({ setup: { postUrls: urls.map((url) => ({ url })) } });

const issuesOf = (error: ZodError | undefined) =>
  (error?.issues ?? []).map(({ path, message }) => ({ path, message }));

const validated = twitterV2PickerFormSchema({ validateTiming: true });
const unvalidated = twitterV2PickerFormSchema({ validateTiming: false });

describe('twitterV2PickerFormSchema', () => {
  describe('with minimal valid input', () => {
    it('applies the action, winner and filter defaults', () => {
      expect(validated.parse(minimalForm())).toEqual({
        setup: { postUrls: [{ url: validUrl }] },
        actions: { repost: true, reply: false },
        winners: { quota: 1 },
        filters: {
          minimumPostCount: null,
          minimumAccountAgeDays: null,
          minimumFollowers: null,
          minimumFollowing: null,
          lastPostWithin: null,
          hasProfileImage: false,
          hasBanner: false,
          hasLocation: false,
          hasDescription: false
        }
      });
    });

    it('omits timing when it is not provided', () => {
      expect(validated.parse(minimalForm())).not.toHaveProperty('timing');
    });

    it('keeps a null timing', () => {
      expect(validated.parse(minimalForm({ timing: null })).timing).toBeNull();
    });

    it('keeps explicit filter values', () => {
      const filters = {
        minimumPostCount: 5,
        minimumAccountAgeDays: 7,
        minimumFollowers: 9,
        minimumFollowing: 11,
        lastPostWithin: 'PAST_DAY',
        hasProfileImage: true,
        hasBanner: true,
        hasLocation: true,
        hasDescription: true
      };

      expect(validated.parse(minimalForm({ filters })).filters).toEqual(
        filters
      );
    });
  });

  describe('post urls', () => {
    it.each([
      'https://x.com/doglover/status/1111',
      'http://x.com/doglover/status/1111',
      'https://www.x.com/doglover/status/1111',
      'https://x.com/a_b_1/status/1'
    ])('accepts %s', (url) => {
      expect(validated.safeParse(withUrls(url)).success).toBe(true);
    });

    it('reports every rule an empty url breaks', () => {
      const result = validated.safeParse(withUrls(''));

      expect(issuesOf(result.error)).toEqual([
        {
          path: ['setup', 'postUrls', 0, 'url'],
          message: 'Post URL is required'
        },
        {
          path: ['setup', 'postUrls', 0, 'url'],
          message: 'Please enter a valid URL'
        },
        { path: ['setup', 'postUrls', 0, 'url'], message: xStatusRefineError }
      ]);
    });

    it('rejects a string that is not a url', () => {
      const result = validated.safeParse(withUrls('not-a-url'));

      expect(issuesOf(result.error)).toEqual([
        {
          path: ['setup', 'postUrls', 0, 'url'],
          message: 'Please enter a valid URL'
        },
        { path: ['setup', 'postUrls', 0, 'url'], message: xStatusRefineError }
      ]);
    });

    it.each([
      'https://example.com/doglover/status/1111',
      'https://twitter.com/doglover/status/1111',
      'https://x.com/doglover/status/1111?s=20',
      'https://x.com/doglover/status/1111/photo/1',
      'https://x.com/doglover',
      'https://x.com/a_very_long_handle_x/status/1'
    ])('rejects the non x.com status url %s', (url) => {
      const result = validated.safeParse(withUrls(url));

      expect(issuesOf(result.error)).toEqual([
        { path: ['setup', 'postUrls', 0, 'url'], message: xStatusRefineError }
      ]);
    });

    it('requires at least one post url', () => {
      const result = validated.safeParse(
        minimalForm({ setup: { postUrls: [] } })
      );

      expect(issuesOf(result.error)).toEqual([
        {
          path: ['setup', 'postUrls'],
          message: 'At least one post URL is required'
        }
      ]);
    });

    it('accepts several distinct posts', () => {
      expect(
        validated.safeParse(
          withUrls(
            'https://x.com/a/status/1',
            'https://x.com/a/status/2',
            'https://x.com/b/status/3'
          )
        ).success
      ).toBe(true);
    });

    it('flags each repeat of the same tweet id across handles', () => {
      const result = validated.safeParse(
        withUrls(
          'https://x.com/a/status/1',
          'https://x.com/b/status/1',
          'https://x.com/c/status/1'
        )
      );

      expect(issuesOf(result.error)).toEqual([
        {
          path: ['setup', 'postUrls', 1, 'url'],
          message: 'This post is already added'
        },
        {
          path: ['setup', 'postUrls', 2, 'url'],
          message: 'This post is already added'
        }
      ]);
    });

    it('does not flag repeated urls without a tweet id as duplicates', () => {
      const result = validated.safeParse(withUrls('not-a-url', 'not-a-url'));

      expect(
        issuesOf(result.error).filter(
          (issue) => issue.message === 'This post is already added'
        )
      ).toEqual([]);
    });
  });

  describe('actions', () => {
    it('requires the repost action', () => {
      const result = validated.safeParse(
        minimalForm({ actions: { repost: false } })
      );

      expect(issuesOf(result.error)).toEqual([
        {
          path: ['actions'],
          message: 'Repost action must be enabled for V2 pickers'
        }
      ]);
    });

    it('allows the reply action alongside repost', () => {
      expect(
        validated.parse(minimalForm({ actions: { repost: true, reply: true } }))
          .actions
      ).toEqual({ repost: true, reply: true });
    });

    it('rejects a missing actions object', () => {
      const form: Record<string, unknown> = minimalForm();
      delete form.actions;

      expect(validated.safeParse(form).success).toBe(false);
    });
  });

  describe('winners', () => {
    it('requires at least one winner', () => {
      const result = validated.safeParse(
        minimalForm({ winners: { quota: 0 } })
      );

      expect(issuesOf(result.error)).toEqual([
        { path: ['winners', 'quota'], message: 'Must have at least 1 winner' }
      ]);
    });

    it('accepts a fractional winner quota', () => {
      expect(
        validated.parse(minimalForm({ winners: { quota: 1.5 } })).winners
      ).toEqual({ quota: 1.5 });
    });
  });

  describe('filters', () => {
    it.each(['PAST_DAY', 'PAST_WEEK', 'PAST_MONTH'])(
      'accepts %s for last post within',
      (lastPostWithin) => {
        expect(
          validated.safeParse(minimalForm({ filters: { lastPostWithin } }))
            .success
        ).toBe(true);
      }
    );

    it('rejects an unknown last post window', () => {
      const result = validated.safeParse(
        minimalForm({ filters: { lastPostWithin: 'PAST_YEAR' } })
      );

      expect(issuesOf(result.error)).toEqual([
        {
          path: ['filters', 'lastPostWithin'],
          message:
            "Invalid enum value. Expected 'PAST_DAY' | 'PAST_WEEK' | 'PAST_MONTH', received 'PAST_YEAR'"
        }
      ]);
    });

    it('accepts negative minimums', () => {
      expect(
        validated.safeParse(minimalForm({ filters: { minimumFollowers: -5 } }))
          .success
      ).toBe(true);
    });

    it('rejects a string minimum', () => {
      expect(
        validated.safeParse(minimalForm({ filters: { minimumPostCount: '5' } }))
          .success
      ).toBe(false);
    });
  });

  describe('timing', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const timing = (runAt: Date | string) => ({
      timing: {
        runAt: typeof runAt === 'string' ? runAt : runAt.toISOString(),
        timeZone: 'UTC'
      }
    });

    describe('when timing validation is enabled', () => {
      it('accepts a run date in the future', () => {
        expect(
          validated.safeParse(
            minimalForm(timing(new Date(NOW.getTime() + DAY_MS)))
          ).success
        ).toBe(true);
      });

      it('rejects a run date in the past', () => {
        const result = validated.safeParse(
          minimalForm(timing(new Date(NOW.getTime() - 1)))
        );

        expect(issuesOf(result.error)).toEqual([
          {
            path: ['timing', 'runAt'],
            message: 'Run date must be in the future'
          }
        ]);
      });

      it('rejects a run date equal to now', () => {
        const result = validated.safeParse(minimalForm(timing(NOW)));

        expect(issuesOf(result.error)).toEqual([
          {
            path: ['timing', 'runAt'],
            message: 'Run date must be in the future'
          }
        ]);
      });

      it('accepts a run date exactly at the maximum schedule window', () => {
        expect(
          validated.safeParse(
            minimalForm(
              timing(
                new Date(NOW.getTime() + MAX_PICKER_SCHEDULE_DAYS * DAY_MS)
              )
            )
          ).success
        ).toBe(true);
      });

      it('rejects a run date past the maximum schedule window', () => {
        const result = validated.safeParse(
          minimalForm(
            timing(
              new Date(NOW.getTime() + MAX_PICKER_SCHEDULE_DAYS * DAY_MS + 1)
            )
          )
        );

        expect(issuesOf(result.error)).toEqual([
          {
            path: ['timing', 'runAt'],
            message: 'Duration cannot exceed 14 days'
          }
        ]);
      });

      it('accepts an unparseable run date', () => {
        expect(validated.parse(minimalForm(timing('garbage'))).timing).toEqual({
          runAt: 'garbage',
          timeZone: 'UTC'
        });
      });

      it('requires a time zone', () => {
        const result = validated.safeParse(
          minimalForm({ timing: { runAt: NOW.toISOString() } })
        );

        expect(issuesOf(result.error)).toEqual([
          { path: ['timing', 'timeZone'], message: 'Required' }
        ]);
      });
    });

    describe('when timing validation is disabled', () => {
      it('accepts a run date in the past', () => {
        expect(
          unvalidated.safeParse(minimalForm(timing(new Date(0)))).success
        ).toBe(true);
      });

      it('accepts a run date past the maximum schedule window', () => {
        expect(
          unvalidated.safeParse(
            minimalForm(timing(new Date(NOW.getTime() + 365 * DAY_MS)))
          ).success
        ).toBe(true);
      });

      it('still requires a time zone', () => {
        expect(
          unvalidated.safeParse(
            minimalForm({ timing: { runAt: NOW.toISOString() } })
          ).success
        ).toBe(false);
      });
    });
  });
});

describe('twitterV2PickerUnvalidatedFormSchema', () => {
  it.each([{}, { setup: { postUrls: [{ url: '' }] } }, []])(
    'accepts the object %j',
    (value) => {
      expect(
        twitterV2PickerUnvalidatedFormSchema.safeParse(value).success
      ).toBe(true);
    }
  );

  it('returns the value unchanged', () => {
    const value = { winners: { quota: 'not-a-number' } };

    expect(twitterV2PickerUnvalidatedFormSchema.parse(value)).toBe(value);
  });

  it.each([null, undefined, 'form', 42, true])('rejects %j', (value) => {
    expect(twitterV2PickerUnvalidatedFormSchema.safeParse(value).success).toBe(
      false
    );
  });
});

describe('publishTwitterV2PickerInputSchema', () => {
  it('accepts a picker id with any form object', () => {
    expect(
      publishTwitterV2PickerInputSchema.safeParse({
        pickerId: 'picker-1',
        form: {}
      }).success
    ).toBe(true);
  });

  it('rejects a missing form', () => {
    expect(
      publishTwitterV2PickerInputSchema.safeParse({ pickerId: 'picker-1' })
        .success
    ).toBe(false);
  });

  it('rejects a missing picker id', () => {
    expect(
      publishTwitterV2PickerInputSchema.safeParse({ form: {} }).success
    ).toBe(false);
  });
});

describe('extractTweetIdFromUrl', () => {
  it.each([
    ['https://x.com/doglover/status/1111', '1111'],
    ['https://twitter.com/doglover/status/42?s=20', '42'],
    ['https://x.com/doglover/status/7/photo/1', '7']
  ])('extracts the id from %s', (url, expected) => {
    expect(extractTweetIdFromUrl(url)).toBe(expected);
  });

  it.each(['', 'https://x.com/doglover', 'https://x.com/a/status/abc'])(
    'returns null for %j',
    (url) => {
      expect(extractTweetIdFromUrl(url)).toBeNull();
    }
  );
});
