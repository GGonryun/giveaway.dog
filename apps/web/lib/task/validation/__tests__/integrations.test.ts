import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateTask } from '../integrations';
import { TaskSchema, TaskType } from '../../schemas';
import { prismaMock } from '@giveaway/testing-server/prisma';
import {
  BASE_TASK,
  IDS,
  applicationError,
  db,
  taskCompletion
} from './fixtures-task-validation';

const external = vi.hoisted(() => ({
  isUserFollowingTarget: vi.fn(),
  isUserLikingPost: vi.fn(),
  isUserRepostingPost: vi.fn(),
  refreshDiscordToken: vi.fn(),
  refreshTwitchToken: vi.fn(),
  refreshVeloraToken: vi.fn()
}));

vi.mock('@/lib/bluesky/is-user-following-target', () => ({
  isUserFollowingTarget: external.isUserFollowingTarget
}));

vi.mock('@/lib/bluesky/is-user-liking-post', () => ({
  isUserLikingPost: external.isUserLikingPost
}));

vi.mock('@/lib/bluesky/is-user-reposting-post', () => ({
  isUserRepostingPost: external.isUserRepostingPost
}));

vi.mock('@/lib/integrations/utils/refresh-discord-token', () => ({
  refreshDiscordToken: external.refreshDiscordToken
}));

vi.mock('@/lib/integrations/utils/refresh-twitch-token', () => ({
  refreshTwitchToken: external.refreshTwitchToken
}));

vi.mock('@/lib/integrations/utils/refresh-velora-token', () => ({
  refreshVeloraToken: external.refreshVeloraToken
}));

const fetchMock = vi.fn<typeof fetch>();

const task = (type: string, fields: Record<string, unknown> = {}) =>
  ({
    ...BASE_TASK,
    id: `task-${type}`,
    type,
    ...fields
  }) as unknown as TaskSchema;

const validate = (taskConfig: TaskSchema, data?: unknown) =>
  validateTask(db, {
    task: taskConfig,
    userId: IDS.userId,
    participantId: IDS.participantId,
    teamId: IDS.teamId,
    data
  });

const totalPrismaCalls = () =>
  Object.values(prismaMock).reduce((total, entry) => {
    if (typeof entry === 'function') {
      return total + entry.mock.calls.length;
    }
    return (
      total +
      Object.values(entry).reduce((sum, fn) => sum + fn.mock.calls.length, 0)
    );
  }, 0);

const PASS_THROUGH_TYPES: TaskType[] = [
  'BONUS_TASK',
  'TWITTER_CONNECT',
  'TWITTER_FOLLOW',
  'TWITTER_RETWEET',
  'TWITTER_RETWEET_IMPORT',
  'TWITTER_RETWEET_IMPORT_V2',
  'TWITTER_LIKE',
  'TWITTER_LIKE_IMPORT',
  'TWITCH_CHAT_IMPORT',
  'YOUTUBE_VISIT',
  'KICK_FOLLOW',
  'INSTAGRAM_VISIT',
  'INSTAGRAM_LIKE',
  'INSTAGRAM_COMMENT',
  'FACEBOOK_VISIT_PAGE',
  'FACEBOOK_VIEW_POST',
  'TIKTOK_FOLLOW',
  'TIKTOK_LIKE',
  'BLUESKY_LIKE_IMPORT',
  'BLUESKY_REPOST_IMPORT',
  'DISCORD_INTERACTION_IMPORT',
  'REFERRAL_LINK',
  'SUBMIT_MEDIA',
  'STEAM_FOLLOW',
  'LINKEDIN_CONNECT',
  'LINKEDIN_FOLLOW'
];

describe('validateTask', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    for (const fn of Object.values(external)) {
      fn.mockReset();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('validation mode', () => {
    it('skips every check when the task validation type is NONE', async () => {
      await expect(
        validate(
          task('BONUS_LIMITED', {
            maxEntrants: 1,
            validation: { type: 'NONE' }
          })
        )
      ).resolves.toBeUndefined();

      expect(prismaMock.taskCompletion.count).not.toHaveBeenCalled();
    });

    it('runs the type check when the task validation type is STRICT', async () => {
      prismaMock.taskCompletion.count.mockResolvedValue(0);

      await validate(
        task('BONUS_LIMITED', {
          maxEntrants: 1,
          validation: { type: 'STRICT' }
        })
      );

      expect(prismaMock.taskCompletion.count).toHaveBeenCalledWith({
        where: { taskId: 'task-BONUS_LIMITED' }
      });
    });

    it('runs the type check when the validation field is null', async () => {
      prismaMock.taskCompletion.count.mockResolvedValue(0);

      await validate(
        task('BONUS_LIMITED', { maxEntrants: 1, validation: null })
      );

      expect(prismaMock.taskCompletion.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('task types without server-side checks', () => {
    it.each(PASS_THROUGH_TYPES)('resolves %s without any I/O', async (type) => {
      await expect(
        validate(task(type), { anything: true })
      ).resolves.toBeUndefined();

      expect(totalPrismaCalls()).toBe(0);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('dispatching to the type-specific check', () => {
    it('validates VISIT_URL follow-up answers', async () => {
      const error = await applicationError(
        validate(
          task('VISIT_URL', {
            afterVisit: { type: 'QUESTION', question: 'Q?', input: 'TEXT' }
          }),
          { answer: 5 }
        )
      );

      expect(error.message).toBe('Invalid input data for visit URL task');
    });

    it('checks the Bluesky account for BLUESKY_CONNECT', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const error = await applicationError(validate(task('BLUESKY_CONNECT')));

      expect(error.message).toBe(
        'User does not have a Bluesky account connected'
      );
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: IDS.userId },
        include: { accounts: true }
      });
    });

    it('checks the Velora account for VELORA_CONNECT', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: IDS.userId,
        accounts: [{ provider: 'bluesky' }]
      });

      const error = await applicationError(validate(task('VELORA_CONNECT')));

      expect(error.message).toBe(
        'User does not have a Velora account connected'
      );
    });

    it('checks the Velora follow for VELORA_FOLLOW', async () => {
      const failure = new Error('velora refresh failed');
      external.refreshVeloraToken.mockRejectedValue(failure);

      await expect(
        validate(
          task('VELORA_FOLLOW', { profileUrl: 'https://velora.tv/gonryun' })
        )
      ).rejects.toBe(failure);
      expect(external.refreshVeloraToken).toHaveBeenCalledWith(db, {
        userId: IDS.userId
      });
    });

    it('checks the Bluesky follow for BLUESKY_FOLLOW', async () => {
      external.isUserFollowingTarget.mockResolvedValue(false);

      const error = await applicationError(
        validate(task('BLUESKY_FOLLOW', { profileUrl: 'bob.bsky.social' }))
      );

      expect(error.message).toBe(
        'User is not following bob.bsky.social on Bluesky'
      );
    });

    it('checks the Bluesky like for BLUESKY_LIKE', async () => {
      external.isUserLikingPost.mockResolvedValue(false);

      const error = await applicationError(
        validate(task('BLUESKY_LIKE', { postUrl: 'https://bsky.app/p' }))
      );

      expect(error.message).toBe('You have not liked this Bluesky post yet');
      expect(external.isUserLikingPost).toHaveBeenCalledWith(db, {
        userId: IDS.userId,
        postUrl: 'https://bsky.app/p'
      });
    });

    it('checks the Bluesky repost for BLUESKY_REPOST', async () => {
      external.isUserRepostingPost.mockResolvedValue(false);

      const error = await applicationError(
        validate(task('BLUESKY_REPOST', { postUrl: 'https://bsky.app/p' }))
      );

      expect(error.message).toBe('You have not reposted this Bluesky post yet');
    });

    it('checks the entrant limit for BONUS_LIMITED', async () => {
      prismaMock.taskCompletion.count.mockResolvedValue(5);

      const error = await applicationError(
        validate(task('BONUS_LIMITED', { maxEntrants: 5 }))
      );

      expect(error.message).toBe(
        'This bonus limited task has reached its maximum number of entrants.'
      );
    });

    it('checks the time window for BONUS_TIMED', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date('2024-02-01T00:00:00.000Z'));

      const error = await applicationError(
        validate(task('BONUS_TIMED', { endDate: '2024-01-01T00:00:00.000Z' }))
      );

      expect(error.message).toBe('This bonus timed task has expired.');
    });

    it('checks loyalty within the team for BONUS_LOYALTY', async () => {
      prismaMock.sweepstakesParticipant.count.mockResolvedValue(0);

      const error = await applicationError(
        validate(task('BONUS_LOYALTY', { loyaltyRequired: 2 }))
      );

      expect(error.message).toBe(
        'You need at least 2 loyalty to complete this tier.'
      );
      expect(prismaMock.sweepstakesParticipant.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: IDS.userId,
            sweepstakes: { teamId: IDS.teamId }
          })
        })
      );
    });

    it('checks the profile for BONUS_COMPLETE_PROFILE', async () => {
      prismaMock.sweepstakes.findFirst.mockResolvedValue(null);

      const error = await applicationError(
        validate(task('BONUS_COMPLETE_PROFILE'))
      );

      expect(error.message).toBe(
        'Unable to verify profile completion requirements'
      );
    });

    it('checks the Steam wishlist for STEAM_WISHLIST', async () => {
      prismaMock.account.findFirst.mockResolvedValue(null);

      const error = await applicationError(
        validate(
          task('STEAM_WISHLIST', {
            appId: 'https://store.steampowered.com/app/730'
          })
        )
      );

      expect(error.message).toBe(
        'You must connect your Steam account before completing this task.'
      );
    });

    it('checks the Discord membership for DISCORD_JOIN', async () => {
      const failure = new Error('discord refresh failed');
      external.refreshDiscordToken.mockRejectedValue(failure);

      await expect(
        validate(
          task('DISCORD_JOIN', {
            channel: 'https://discord.com/channels/1/2'
          })
        )
      ).rejects.toBe(failure);
      expect(external.refreshDiscordToken).toHaveBeenCalledWith(db, {
        userId: IDS.userId
      });
    });

    it('checks the Twitch follow for TWITCH_FOLLOW', async () => {
      const failure = new Error('twitch refresh failed');
      external.refreshTwitchToken.mockRejectedValue(failure);

      await expect(
        validate(
          task('TWITCH_FOLLOW', { channel: 'https://twitch.tv/streamer' })
        )
      ).rejects.toBe(failure);
      expect(external.refreshTwitchToken).toHaveBeenCalledWith(db, {
        userId: IDS.userId
      });
    });

    it('checks the single code for SECRET_CODE', async () => {
      prismaMock.taskProgress.upsert.mockResolvedValue({ count: 1 });
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await expect(
        validate(task('SECRET_CODE', { code: 'WOOF' }), { code: 'woof' })
      ).resolves.toBeUndefined();
      expect(prismaMock.taskProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participantId_taskId: {
              taskId: 'task-SECRET_CODE',
              participantId: IDS.participantId
            }
          }
        })
      );
    });

    it('checks the list of codes for SECRET_CODE_V2', async () => {
      prismaMock.taskProgress.upsert.mockResolvedValue({ count: 1 });
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await expect(
        validate(task('SECRET_CODE_V2', { codes: ['ONE', 'TWO'] }), {
          code: 'two'
        })
      ).resolves.toBeUndefined();
    });

    it('checks the answer for ASK_QUESTION', async () => {
      const error = await applicationError(
        validate(task('ASK_QUESTION', { question: 'Q?' }), {})
      );

      expect(error.message).toBe('Invalid input data for ask question task');
    });

    it('checks the choice for SINGLE_CHOICE', async () => {
      const error = await applicationError(
        validate(task('SINGLE_CHOICE', { options: ['a', 'b'] }), {})
      );

      expect(error.message).toBe('Invalid input data for single choice task');
    });

    it('checks the choices for MULTIPLE_CHOICE', async () => {
      const error = await applicationError(
        validate(task('MULTIPLE_CHOICE', { options: ['a', 'b'] }), {})
      );

      expect(error.message).toBe('Invalid input data for multiple choice task');
    });

    it('passes the participant to the completion lookup', async () => {
      prismaMock.taskCompletion.findFirst.mockResolvedValue(
        taskCompletion('task-MULTIPLE_CHOICE')
      );

      const error = await applicationError(
        validate(task('MULTIPLE_CHOICE', { options: ['a', 'b'] }), {
          choices: ['a']
        })
      );

      expect(error.message).toBe('Task already completed');
      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: {
          taskId: 'task-MULTIPLE_CHOICE',
          participantId: IDS.participantId
        }
      });
    });
  });

  it('rejects for an unknown task type', async () => {
    await expect(validate(task('UNKNOWN_TYPE'))).rejects.toThrow(
      'Unexpected value: [object Object]'
    );
  });
});
