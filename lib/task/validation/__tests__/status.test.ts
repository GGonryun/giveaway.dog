import { describe, it, expect } from 'vitest';
import { CompletionStatus } from '@prisma/client';
import { computeTaskStatus } from '../status';
import { TASK_LABEL, TaskSchema, TaskType } from '../../schemas';
import { BASE_TASK } from './fixtures-task-validation';

const COMPLETED_TYPES: TaskType[] = [
  'BONUS_TASK',
  'BONUS_TIMED',
  'BONUS_LIMITED',
  'BONUS_LOYALTY',
  'BONUS_COMPLETE_PROFILE',
  'VISIT_URL',
  'STEAM_WISHLIST',
  'STEAM_FOLLOW',
  'DISCORD_JOIN',
  'TWITCH_FOLLOW',
  'KICK_FOLLOW',
  'TWITTER_CONNECT',
  'TWITTER_FOLLOW',
  'TWITTER_LIKE',
  'TWITTER_RETWEET',
  'SECRET_CODE',
  'SECRET_CODE_V2',
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
  'VELORA_CONNECT',
  'VELORA_FOLLOW',
  'LINKEDIN_CONNECT',
  'LINKEDIN_FOLLOW',
  'ASK_QUESTION',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'REFERRAL_LINK',
  'SUBMIT_MEDIA'
];

const PENDING_TYPES: TaskType[] = [
  'TWITTER_RETWEET_IMPORT',
  'TWITTER_RETWEET_IMPORT_V2',
  'TWITTER_LIKE_IMPORT',
  'BLUESKY_LIKE_IMPORT',
  'BLUESKY_REPOST_IMPORT',
  'DISCORD_INTERACTION_IMPORT',
  'TWITCH_CHAT_IMPORT'
];

const taskOfType = (type: string) =>
  ({ ...BASE_TASK, id: `task-${type}`, type }) as unknown as TaskSchema;

describe('computeTaskStatus', () => {
  it.each(COMPLETED_TYPES)('returns COMPLETED for %s tasks', (type) => {
    expect(computeTaskStatus(taskOfType(type))).toBe(
      CompletionStatus.COMPLETED
    );
  });

  it.each(PENDING_TYPES)('returns PENDING for %s import tasks', (type) => {
    expect(computeTaskStatus(taskOfType(type))).toBe(CompletionStatus.PENDING);
  });

  it('classifies every known task type as either COMPLETED or PENDING', () => {
    const classified = [...COMPLETED_TYPES, ...PENDING_TYPES].sort();

    expect(classified).toEqual(Object.keys(TASK_LABEL).sort());
  });

  it('throws for an unknown task type', () => {
    expect(() => computeTaskStatus(taskOfType('UNKNOWN_TYPE'))).toThrow(
      'Unexpected value: [object Object]'
    );
  });
});
