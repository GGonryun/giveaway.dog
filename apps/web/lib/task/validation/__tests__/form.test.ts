import { describe, it, expect } from 'vitest';
import z from 'zod';
import { refineSweepstakeTasks } from '../form';
import { TaskSchema, TaskType } from '../../schemas';
import type { BaseGiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { BASE_TASK } from '@giveaway/testing-server/fixtures-task-validation';

const FORM_START = new Date('2024-05-01T00:00:00.000Z');
const FORM_END = new Date('2024-05-31T00:00:00.000Z');

const task = (type: string, fields: Record<string, unknown> = {}) =>
  ({
    ...BASE_TASK,
    id: `task-${type}`,
    type,
    ...fields
  }) as unknown as TaskSchema;

const refine = async (tasks: TaskSchema[], maxLoyalty = 5) => {
  const issues: z.IssueData[] = [];
  const ctx = {
    addIssue: (issue: z.IssueData) => {
      issues.push(issue);
    },
    path: []
  } as unknown as z.RefinementCtx;
  const form = {
    tasks,
    timing: { startDate: FORM_START, endDate: FORM_END, timeZone: 'UTC' }
  } as unknown as BaseGiveawayFormSchema;

  await refineSweepstakeTasks({ ctx, form, validate: true, maxLoyalty });

  return issues;
};

const PASS_THROUGH_TYPES: TaskType[] = [
  'BONUS_LIMITED',
  'BONUS_TASK',
  'BONUS_COMPLETE_PROFILE',
  'VISIT_URL',
  'TWITTER_CONNECT',
  'TWITTER_FOLLOW',
  'TWITTER_RETWEET',
  'TWITTER_RETWEET_IMPORT_V2',
  'TWITTER_LIKE',
  'STEAM_WISHLIST',
  'STEAM_FOLLOW',
  'DISCORD_JOIN',
  'DISCORD_INTERACTION_IMPORT',
  'TWITCH_FOLLOW',
  'TWITCH_CHAT_IMPORT',
  'KICK_FOLLOW',
  'SECRET_CODE',
  'YOUTUBE_VISIT',
  'INSTAGRAM_VISIT',
  'INSTAGRAM_LIKE',
  'INSTAGRAM_COMMENT',
  'FACEBOOK_VISIT_PAGE',
  'FACEBOOK_VIEW_POST',
  'TIKTOK_FOLLOW',
  'TIKTOK_LIKE',
  'BLUESKY_CONNECT',
  'BLUESKY_FOLLOW',
  'BLUESKY_LIKE',
  'BLUESKY_REPOST',
  'BLUESKY_LIKE_IMPORT',
  'BLUESKY_REPOST_IMPORT',
  'ASK_QUESTION',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'SUBMIT_MEDIA',
  'VELORA_CONNECT',
  'VELORA_FOLLOW',
  'LINKEDIN_CONNECT',
  'LINKEDIN_FOLLOW'
];

describe('refineSweepstakeTasks', () => {
  describe('task types without extra rules', () => {
    it.each(PASS_THROUGH_TYPES)('adds no issues for %s', async (type) => {
      expect(await refine([task(type)])).toEqual([]);
    });
  });

  describe('deprecated task types', () => {
    it.each(['TWITTER_LIKE_IMPORT', 'TWITTER_RETWEET_IMPORT'])(
      'reports %s as no longer supported',
      async (type) => {
        expect(await refine([task('BONUS_TASK'), task(type)])).toEqual([
          {
            path: ['tasks', 1, 'type'],
            code: z.ZodIssueCode.custom,
            message: `Task type "${type}" is no longer supported and cannot be used in new giveaways`
          }
        ]);
      }
    );
  });

  describe('tasksRequired', () => {
    it('reports a requirement equal to the number of tasks', async () => {
      expect(
        await refine([
          task('BONUS_TASK'),
          task('BONUS_TASK', { tasksRequired: 2 })
        ])
      ).toEqual([
        {
          path: ['tasks', 1, 'tasksRequired'],
          code: z.ZodIssueCode.too_big,
          maximum: 2,
          inclusive: false,
          type: 'number',
          message: 'Tasks required cannot exceed total number of tasks (2)'
        }
      ]);
    });

    it('accepts a requirement one below the number of tasks', async () => {
      expect(
        await refine([
          task('BONUS_TASK'),
          task('BONUS_TASK', { tasksRequired: 1 })
        ])
      ).toEqual([]);
    });

    it('skips the check when tasksRequired is undefined', async () => {
      expect(
        await refine([task('BONUS_TASK', { tasksRequired: undefined })])
      ).toEqual([]);
    });

    it('reports the deprecation before the tasksRequired issue', async () => {
      const issues = await refine([
        task('TWITTER_LIKE_IMPORT', { tasksRequired: 1 })
      ]);

      expect(issues.map((issue) => issue.path)).toEqual([
        ['tasks', 0, 'type'],
        ['tasks', 0, 'tasksRequired']
      ]);
    });
  });

  describe('BONUS_LOYALTY', () => {
    it('reports a loyalty requirement above the maximum loyalty', async () => {
      expect(
        await refine([task('BONUS_LOYALTY', { loyaltyRequired: 4 })], 3)
      ).toEqual([
        {
          path: ['tasks', 0, 'loyaltyRequired'],
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          inclusive: true,
          type: 'number',
          message:
            'Loyalty required cannot exceed your total number of published sweepstakes (3)'
        }
      ]);
    });

    it('accepts a loyalty requirement equal to the maximum loyalty', async () => {
      expect(
        await refine([task('BONUS_LOYALTY', { loyaltyRequired: 3 })], 3)
      ).toEqual([]);
    });
  });

  describe('BONUS_TIMED', () => {
    const timed = (startDate?: string, endDate?: string) =>
      task('BONUS_TIMED', { startDate, endDate });

    it('accepts a window inside the giveaway timing', async () => {
      expect(
        await refine([
          timed('2024-05-02T00:00:00.000Z', '2024-05-10T00:00:00.000Z')
        ])
      ).toEqual([]);
    });

    it('accepts a window equal to the giveaway timing', async () => {
      expect(
        await refine([timed(FORM_START.toISOString(), FORM_END.toISOString())])
      ).toEqual([]);
    });

    it('accepts an end date equal to the giveaway start', async () => {
      expect(
        await refine([timed(undefined, FORM_START.toISOString())])
      ).toEqual([]);
    });

    it('accepts a start date equal to the giveaway end', async () => {
      expect(await refine([timed(FORM_END.toISOString(), undefined)])).toEqual(
        []
      );
    });

    it('reports an end date before the giveaway start', async () => {
      expect(
        await refine([timed(undefined, '2024-04-30T00:00:00.000Z')])
      ).toEqual([
        {
          path: ['tasks', 0, 'endDate'],
          code: z.ZodIssueCode.invalid_date,
          message: 'End date cannot be before sweepstakes start date'
        }
      ]);
    });

    it('reports an end date after the giveaway end', async () => {
      expect(
        await refine([timed(undefined, '2024-06-01T00:00:00.000Z')])
      ).toEqual([
        {
          path: ['tasks', 0, 'endDate'],
          code: z.ZodIssueCode.invalid_date,
          message: 'End date cannot be after sweepstakes end date'
        }
      ]);
    });

    it('reports a start date before the giveaway start', async () => {
      expect(
        await refine([timed('2024-04-30T00:00:00.000Z', undefined)])
      ).toEqual([
        {
          path: ['tasks', 0, 'startDate'],
          code: z.ZodIssueCode.invalid_date,
          message: 'Start date cannot be before sweepstakes start date'
        }
      ]);
    });

    it('reports a start date after the giveaway end', async () => {
      expect(
        await refine([timed('2024-06-01T00:00:00.000Z', undefined)])
      ).toEqual([
        {
          path: ['tasks', 0, 'startDate'],
          code: z.ZodIssueCode.invalid_date,
          message: 'Start date cannot be after sweepstakes end date'
        }
      ]);
    });

    it.each([
      ['before', '2024-05-10T00:00:00.000Z', '2024-05-05T00:00:00.000Z'],
      ['equal to', '2024-05-10T00:00:00.000Z', '2024-05-10T00:00:00.000Z']
    ])(
      'reports an end date %s the start date',
      async (_label, startDate, endDate) => {
        expect(await refine([timed(startDate, endDate)])).toEqual([
          {
            path: ['tasks', 0, 'endDate'],
            code: z.ZodIssueCode.invalid_date,
            message: 'End date must be after start date'
          }
        ]);
      }
    );

    it('reports both dates when neither is set', async () => {
      const message =
        'At least one of start date or end date must be set for timed bonus tasks';

      expect(await refine([timed(undefined, undefined)])).toEqual([
        {
          path: ['tasks', 0, 'startDate'],
          code: z.ZodIssueCode.custom,
          message
        },
        {
          path: ['tasks', 0, 'endDate'],
          code: z.ZodIssueCode.custom,
          message
        }
      ]);
    });

    it('accumulates every violated window rule', async () => {
      const issues = await refine([
        timed('2024-06-02T00:00:00.000Z', '2024-04-01T00:00:00.000Z')
      ]);

      expect(issues.map((issue) => issue.message)).toEqual([
        'End date cannot be before sweepstakes start date',
        'Start date cannot be after sweepstakes end date',
        'End date must be after start date'
      ]);
    });
  });

  describe('REFERRAL_LINK', () => {
    it('accepts a single referral link task', async () => {
      expect(await refine([task('BONUS_TASK'), task('REFERRAL_LINK')])).toEqual(
        []
      );
    });

    it('reports the duplicate on the task list and on each referral task', async () => {
      const message = 'Only one referral link task is allowed per giveaway';

      expect(
        await refine([
          task('REFERRAL_LINK'),
          task('BONUS_TASK'),
          task('REFERRAL_LINK')
        ])
      ).toEqual([
        { path: ['tasks'], code: z.ZodIssueCode.custom, message },
        { path: ['tasks', 0, 'title'], code: z.ZodIssueCode.custom, message },
        { path: ['tasks', 2, 'title'], code: z.ZodIssueCode.custom, message }
      ]);
    });
  });

  describe('SECRET_CODE_V2', () => {
    it('accepts codes that are all filled in', async () => {
      expect(
        await refine([task('SECRET_CODE_V2', { codes: ['ONE', 'TWO'] })])
      ).toEqual([]);
    });

    it.each([
      ['an empty code', ['ONE', '']],
      ['a whitespace-only code', ['   ', 'TWO']]
    ])('reports %s', async (_label, codes) => {
      expect(await refine([task('SECRET_CODE_V2', { codes })])).toEqual([
        {
          path: ['tasks', 0, 'codes'],
          code: z.ZodIssueCode.custom,
          message: 'All secret codes must be filled in'
        }
      ]);
    });
  });

  it('adds no issues for an empty task list', async () => {
    expect(await refine([])).toEqual([]);
  });

  it('rejects for an unknown task type', async () => {
    await expect(refine([task('UNKNOWN_TYPE')])).rejects.toThrow(
      'Unexpected value: [object Object]'
    );
  });
});
