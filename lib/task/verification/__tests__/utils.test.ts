import { describe, it, expect } from 'vitest';
import {
  getProviderByTask,
  getProviderLabel,
  getProviderLink,
  isTaskVerifiable,
  requiresManualVerification,
  supportsAutomatedReverification
} from '../utils';
import type { TaskType } from '@/lib/task/schemas';
import type { ProviderSchema } from '@/lib/integrations/schemas/providers';
import { ALL_TASK_TYPES } from '@/lib/task/procedures/__tests__/fixtures-task-procedures-verification';

const provider = (overrides: Partial<ProviderSchema> = {}): ProviderSchema => ({
  type: 'TWITTER',
  scopes: [],
  label: 'alex_x',
  link: 'https://x.com/alex_x',
  status: 'ACTIVE',
  ...overrides
});

const AUTOMATIC_TYPES: TaskType[] = [
  'BLUESKY_CONNECT',
  'BLUESKY_FOLLOW',
  'BLUESKY_LIKE',
  'BLUESKY_LIKE_IMPORT',
  'BLUESKY_REPOST',
  'BLUESKY_REPOST_IMPORT',
  'DISCORD_INTERACTION_IMPORT',
  'DISCORD_JOIN',
  'LINKEDIN_CONNECT',
  'SECRET_CODE',
  'SECRET_CODE_V2',
  'STEAM_WISHLIST',
  'TWITCH_CHAT_IMPORT',
  'TWITCH_FOLLOW',
  'TWITTER_CONNECT',
  'TWITTER_LIKE_IMPORT',
  'TWITTER_RETWEET_IMPORT',
  'TWITTER_RETWEET_IMPORT_V2',
  'VELORA_CONNECT',
  'VELORA_FOLLOW'
];

const MANUAL_TYPES: TaskType[] = [
  'ASK_QUESTION',
  'BONUS_COMPLETE_PROFILE',
  'BONUS_LIMITED',
  'BONUS_LOYALTY',
  'BONUS_TASK',
  'BONUS_TIMED',
  'FACEBOOK_VIEW_POST',
  'FACEBOOK_VISIT_PAGE',
  'INSTAGRAM_COMMENT',
  'INSTAGRAM_LIKE',
  'INSTAGRAM_VISIT',
  'KICK_FOLLOW',
  'LINKEDIN_FOLLOW',
  'MULTIPLE_CHOICE',
  'REFERRAL_LINK',
  'SINGLE_CHOICE',
  'SUBMIT_MEDIA',
  'TIKTOK_FOLLOW',
  'TIKTOK_LIKE',
  'TWITTER_FOLLOW',
  'TWITTER_LIKE',
  'TWITTER_RETWEET',
  'VISIT_URL',
  'YOUTUBE_VISIT'
];

const UNKNOWN_TYPE = 'NOT_A_TASK' as TaskType;

describe('isTaskVerifiable', () => {
  it.each(AUTOMATIC_TYPES)('returns true for automatic task %s', (type) => {
    expect(isTaskVerifiable(type)).toBe(true);
  });

  it.each(MANUAL_TYPES)('returns true for manual task %s', (type) => {
    expect(isTaskVerifiable(type)).toBe(true);
  });

  it('returns false for the self-reported steam follow task', () => {
    expect(isTaskVerifiable('STEAM_FOLLOW')).toBe(false);
  });

  it('treats every task type except steam follow as verifiable', () => {
    expect(ALL_TASK_TYPES.filter((type) => !isTaskVerifiable(type))).toEqual([
      'STEAM_FOLLOW'
    ]);
  });

  it('returns false for an unknown task type', () => {
    expect(isTaskVerifiable(UNKNOWN_TYPE)).toBe(false);
  });
});

describe('supportsAutomatedReverification', () => {
  it('returns true exactly for the automatically verified task types', () => {
    expect(
      ALL_TASK_TYPES.filter(supportsAutomatedReverification).sort()
    ).toEqual(AUTOMATIC_TYPES);
  });

  it('returns false for a manually verified task', () => {
    expect(supportsAutomatedReverification('TWITTER_FOLLOW')).toBe(false);
  });

  it('returns false for a self-reported task', () => {
    expect(supportsAutomatedReverification('STEAM_FOLLOW')).toBe(false);
  });

  it('returns false for an unknown task type', () => {
    expect(supportsAutomatedReverification(UNKNOWN_TYPE)).toBe(false);
  });
});

describe('requiresManualVerification', () => {
  it('returns true exactly for the manually verified task types', () => {
    expect(ALL_TASK_TYPES.filter(requiresManualVerification).sort()).toEqual(
      MANUAL_TYPES
    );
  });

  it('returns false for an automatically verified task', () => {
    expect(requiresManualVerification('SECRET_CODE')).toBe(false);
  });

  it('returns false for a self-reported task', () => {
    expect(requiresManualVerification('STEAM_FOLLOW')).toBe(false);
  });

  it('returns false for an unknown task type', () => {
    expect(requiresManualVerification(UNKNOWN_TYPE)).toBe(false);
  });
});

describe('getProviderByTask', () => {
  it('returns the provider matching the identity provider of the task', () => {
    const twitter = provider();
    const bluesky = provider({ type: 'BLUESKY', label: 'alex.bsky.social' });

    expect(getProviderByTask('TWITTER_FOLLOW', [bluesky, twitter])).toBe(
      twitter
    );
  });

  it('returns the first provider when several share the identity provider', () => {
    const first = provider({ label: 'first' });
    const second = provider({ label: 'second' });

    expect(getProviderByTask('TWITTER_LIKE', [first, second])).toBe(first);
  });

  it('matches anonymous tasks against an anonymous provider', () => {
    const anonymous = provider({ type: 'ANONYMOUS', label: 'anon' });

    expect(getProviderByTask('BONUS_TASK', [provider(), anonymous])).toBe(
      anonymous
    );
  });

  it('returns null when no provider matches', () => {
    expect(
      getProviderByTask('INSTAGRAM_VISIT', [provider({ type: 'BLUESKY' })])
    ).toBeNull();
  });

  it('returns null when the user has no providers', () => {
    expect(getProviderByTask('TWITTER_FOLLOW', [])).toBeNull();
  });
});

describe('getProviderLink', () => {
  it('returns the link of the matching provider', () => {
    expect(
      getProviderLink('TWITCH_FOLLOW', [
        provider({ type: 'TWITCH', link: 'https://twitch.tv/alex' })
      ])
    ).toBe('https://twitch.tv/alex');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty', '']
  ])('returns null when the provider link is %s', (_label, link) => {
    expect(getProviderLink('TWITTER_FOLLOW', [provider({ link })])).toBeNull();
  });

  it('returns null when no provider matches', () => {
    expect(
      getProviderLink('DISCORD_JOIN', [provider({ type: 'TWITTER' })])
    ).toBeNull();
  });
});

describe('getProviderLabel', () => {
  it('returns the label of the matching provider', () => {
    expect(
      getProviderLabel('KICK_FOLLOW', [
        provider({ type: 'KICK', label: 'alex_kick' })
      ])
    ).toBe('alex_kick');
  });

  it('returns null when the provider label is empty', () => {
    expect(
      getProviderLabel('TWITTER_FOLLOW', [provider({ label: '' })])
    ).toBeNull();
  });

  it('returns null when no provider matches', () => {
    expect(getProviderLabel('LINKEDIN_FOLLOW', [provider()])).toBeNull();
  });
});
