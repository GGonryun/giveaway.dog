import { describe, it, expect } from 'vitest';
import { toDefaultValues } from '../defaults';
import { taskSchema, type TaskType } from '../schemas';
import { TASK_TYPES } from './fixtures-task-schemas';

const SPECIFIC_DEFAULTS: [TaskType, Record<string, unknown>][] = [
  ['BONUS_TASK', { title: 'Click for a bonus entry' }],
  ['BONUS_TIMED', { title: 'Click for a bonus entry' }],
  ['BONUS_LIMITED', { title: 'Click for a bonus entry', maxEntrants: 100 }],
  ['BONUS_LOYALTY', { title: 'Click for a bonus entry', loyaltyRequired: 3 }],
  ['BONUS_COMPLETE_PROFILE', { title: 'Complete your profile' }],
  ['VISIT_URL', { title: 'Visit our website', label: 'Click Here!', href: '' }],
  ['TWITTER_CONNECT', { title: 'Connect to X (Twitter)' }],
  ['TWITTER_FOLLOW', { title: 'Follow us on X (Twitter)', username: '' }],
  ['TWITTER_RETWEET', { title: 'Repost our sweepstakes', tweetId: '' }],
  [
    'TWITTER_RETWEET_IMPORT',
    { title: 'Repost our sweepstakes', tweetId: '', importingAccount: '' }
  ],
  [
    'TWITTER_RETWEET_IMPORT_V2',
    { title: 'Repost our sweepstakes', tweetId: '' }
  ],
  ['TWITTER_LIKE', { title: 'Like our post', tweetId: '' }],
  [
    'TWITTER_LIKE_IMPORT',
    { title: 'Like our post', tweetId: '', importingAccount: '' }
  ],
  ['STEAM_WISHLIST', { title: 'Add to your Steam Wishlist', appId: '' }],
  [
    'STEAM_FOLLOW',
    { title: 'Follow on Steam', developer: '', requireProof: true }
  ],
  [
    'DISCORD_JOIN',
    { title: 'Join our Discord server', invite: '', channel: '' }
  ],
  [
    'DISCORD_INTERACTION_IMPORT',
    { title: 'Interact on Discord', importingAccount: '', roles: [], link: '' }
  ],
  ['TWITCH_FOLLOW', { title: 'Follow us on Twitch', channel: '' }],
  [
    'TWITCH_CHAT_IMPORT',
    {
      title: 'Enter via Twitch Chat',
      importingAccount: '',
      channelUrl: '',
      trigger: '!giveaway'
    }
  ],
  ['KICK_FOLLOW', { title: 'Follow us on Kick', channel: '' }],
  [
    'SECRET_CODE',
    {
      title: 'Enter the secret code',
      code: 'MY_SECRET_CODE',
      hint: 'Check our announcement channel for the code!',
      caseSensitive: false
    }
  ],
  [
    'SECRET_CODE_V2',
    {
      title: 'Enter the secret code',
      codes: ['MY_SECRET_CODE'],
      hint: 'Check our announcement channel for the code!',
      caseSensitive: false
    }
  ],
  [
    'YOUTUBE_VISIT',
    {
      title: 'Visit our YouTube channel',
      channelUrl: '',
      channelName: '',
      subConfirmation: false
    }
  ],
  ['INSTAGRAM_VISIT', { title: 'Visit our Instagram profile', profileUrl: '' }],
  ['INSTAGRAM_LIKE', { title: 'Like our Instagram post', postUrl: '' }],
  [
    'INSTAGRAM_COMMENT',
    { title: 'Comment on our Instagram post', postUrl: '' }
  ],
  [
    'FACEBOOK_VISIT_PAGE',
    {
      title: 'Visit our Facebook page',
      pageUrl: '',
      afterVisit: { type: 'INSTANT' }
    }
  ],
  ['FACEBOOK_VIEW_POST', { title: 'View our Facebook post', postUrl: '' }],
  ['TIKTOK_FOLLOW', { title: 'Follow us on TikTok', profileUrl: '' }],
  ['TIKTOK_LIKE', { title: 'Like our TikTok post', postUrl: '' }],
  ['BLUESKY_CONNECT', { title: 'Connect to Bluesky' }],
  ['VELORA_CONNECT', { title: 'Connect to Velora' }],
  ['LINKEDIN_CONNECT', { title: 'Connect to LinkedIn' }],
  ['LINKEDIN_FOLLOW', { title: 'Follow us on LinkedIn', profileUrl: '' }],
  ['VELORA_FOLLOW', { title: 'Follow us on Velora', profileUrl: '' }],
  ['BLUESKY_FOLLOW', { title: 'Follow us on Bluesky', profileUrl: '' }],
  ['BLUESKY_LIKE', { title: 'Like our Bluesky post', postUrl: '' }],
  ['BLUESKY_REPOST', { title: 'Repost on Bluesky', postUrl: '' }],
  [
    'BLUESKY_LIKE_IMPORT',
    { title: 'Like our Bluesky post', postUrl: '', importingAccount: '' }
  ],
  [
    'BLUESKY_REPOST_IMPORT',
    { title: 'Repost on Bluesky', postUrl: '', importingAccount: '' }
  ],
  ['REFERRAL_LINK', { title: 'Refer a friend', maximum: null }],
  [
    'ASK_QUESTION',
    {
      title: 'Answer a question',
      question: '',
      placeholder: '',
      instructions: ''
    }
  ],
  [
    'SINGLE_CHOICE',
    {
      title: 'Select an option',
      question: '',
      options: ['Option 1', 'Option 2']
    }
  ],
  [
    'MULTIPLE_CHOICE',
    {
      title: 'Select one or more options',
      question: '',
      options: ['Option 1', 'Option 2'],
      minSelections: 1,
      maxSelections: undefined
    }
  ],
  [
    'SUBMIT_MEDIA',
    {
      title: 'Submit media',
      description: 'Submit the required media as proof.',
      acceptedTypes: ['IMAGE']
    }
  ]
];

const SCHEMA_VALID_DEFAULTS: TaskType[] = [
  'BONUS_TASK',
  'BONUS_TIMED',
  'BONUS_LIMITED',
  'BONUS_LOYALTY',
  'BONUS_COMPLETE_PROFILE',
  'SUBMIT_MEDIA',
  'TWITTER_CONNECT',
  'SECRET_CODE',
  'SECRET_CODE_V2',
  'BLUESKY_CONNECT',
  'VELORA_CONNECT',
  'REFERRAL_LINK',
  'LINKEDIN_CONNECT'
];

describe('toDefaultValues', () => {
  it('defines defaults for every task type', () => {
    expect(SPECIFIC_DEFAULTS.map(([type]) => type).sort()).toEqual(
      [...TASK_TYPES].sort()
    );
  });

  it.each(SPECIFIC_DEFAULTS)(
    'returns the default %s task with an empty id and one optional entry',
    (type, specific) => {
      expect(toDefaultValues(type)).toStrictEqual({
        id: '',
        type,
        value: 1,
        mandatory: false,
        tasksRequired: 0,
        ...specific
      });
    }
  );

  it('includes an explicit undefined max selections key for multiple choice', () => {
    expect(Object.keys(toDefaultValues('MULTIPLE_CHOICE'))).toContain(
      'maxSelections'
    );
  });

  it('returns a new object on every call so callers can mutate it safely', () => {
    const first = toDefaultValues('SINGLE_CHOICE');
    first.options.push('Option 3');

    const second = toDefaultValues('SINGLE_CHOICE');

    expect(second).not.toBe(first);
    expect(second.options).toEqual(['Option 1', 'Option 2']);
  });

  it('returns undefined for an unknown task type', () => {
    expect(toDefaultValues('UNKNOWN' as TaskType)).toBeUndefined();
  });

  it('produces defaults that pass the task schema only for types without required user input', () => {
    const valid = TASK_TYPES.filter(
      (type) => taskSchema.safeParse(toDefaultValues(type)).success
    );

    expect(valid.sort()).toEqual([...SCHEMA_VALID_DEFAULTS].sort());
  });

  it('produces a steam follow default that requires proof even though the schema defaults it to false', () => {
    expect(toDefaultValues('STEAM_FOLLOW').requireProof).toBe(true);
  });
});
