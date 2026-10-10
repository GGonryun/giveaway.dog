import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import z from 'zod';
import { IdentityProvider } from '@giveaway/db-model';
import {
  afterVisitSchema,
  askQuestionTaskSchema,
  baseTaskSchema,
  blueskyConnectTaskSchema,
  blueskyFollowTaskSchema,
  blueskyLikeImportTaskSchema,
  blueskyLikeTaskSchema,
  blueskyRepostImportTaskSchema,
  blueskyRepostTaskSchema,
  bonusCompleteProfileTaskSchema,
  bonusLimitedTaskSchema,
  bonusLoyaltyTaskSchema,
  bonusTaskSchema,
  bonusTimedTaskSchema,
  discordInteractionImportTaskSchema,
  discordJoinTaskSchema,
  facebookViewPostTaskSchema,
  facebookVisitPageTaskSchema,
  instagramCommentTaskSchema,
  instagramLikeTaskSchema,
  instagramVisitTaskSchema,
  kickFollowTaskSchema,
  linkedInConnectTaskSchema,
  linkedInFollowTaskSchema,
  MAX_ALLOWED_LOYALTY_TIERS,
  multipleChoiceTaskSchema,
  participantTaskSchema,
  parseTwitterProofSchema,
  referralLinkTaskSchema,
  secretCodeTaskSchema,
  secretCodeV2TaskSchema,
  singleChoiceTaskSchema,
  steamFollowTaskSchema,
  steamWishlistTaskSchema,
  submitMediaTaskSchema,
  TASK_ALLOW_MANUAL_ADD,
  TASK_CATEGORY,
  TASK_CATEGORY_LABEL,
  TASK_DUPLICATE_RESTRICTION,
  TASK_IDENTITY_PROVIDER,
  TASK_INPUT_SCHEMA,
  TASK_IS_DEPRECATED,
  TASK_IS_IMPORT,
  TASK_JOB_DATA_SCHEMA,
  TASK_LABEL,
  TASK_PLATFORM,
  TASK_PLATFORM_LABEL,
  TASK_REQUIRED_SCOPES,
  TASK_VERIFICATION_REQUIREMENT,
  taskCategorySchema,
  taskPlatformSchema,
  taskSchema,
  tiktokFollowTaskSchema,
  tiktokLikeTaskSchema,
  toTaskSchema,
  toTaskSchemaSafe,
  toTwitterProofSchema,
  twitchChatImportTaskSchema,
  twitchFollowTaskSchema,
  twitterConnectTaskSchema,
  twitterFollowTaskSchema,
  twitterLikeImportTaskSchema,
  twitterLikeTaskSchema,
  twitterProofSchema,
  twitterRetweetImportTaskSchema,
  twitterRetweetTaskSchema,
  twitterRetweetV2ImportTaskSchema,
  userEntriesSchema,
  validationSchema,
  veloraConnectTaskSchema,
  veloraFollowTaskSchema,
  visitUrlTaskSchema,
  youtubeVisitTaskSchema,
  type TaskType
} from '../schemas';
import { ApplicationError } from '@giveaway/util-errors';
import {
  IDENTITY_PROVIDER_LABEL,
  PROVIDER_REQUIRED_SCOPES
} from '@giveaway/integration-model/providers';
import {
  BLUESKY_POST_URL,
  INSTAGRAM_POST_URL,
  storedTask,
  TASK_TYPES,
  toStoredConfig,
  TWEET_URL,
  VALID_TASKS
} from '../testing/fixtures-task-schemas';

const messagesFor = (schema: z.ZodTypeAny, value: unknown): string[] => {
  const result = schema.safeParse(value);
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.message);
};

const withField = (
  type: TaskType,
  field: string,
  value: unknown
): Record<string, unknown> => ({ ...VALID_TASKS[type], [field]: value });

const withoutField = (
  type: TaskType,
  field: string
): Record<string, unknown> => {
  const copy: Record<string, unknown> = { ...VALID_TASKS[type] };
  delete copy[field];
  return copy;
};

const typesWhere = <V>(map: Record<TaskType, V>, value: V): TaskType[] =>
  TASK_TYPES.filter((type) => map[type] === value).sort();

const sorted = (types: TaskType[]) => [...types].sort();

const catchError = (fn: () => unknown): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the function to throw');
};

const IDENTITY_PROVIDERS = Object.values(IdentityProvider);

describe('baseTaskSchema', () => {
  const base = {
    id: 'task-1',
    type: 'ANYTHING',
    title: 'A task',
    value: 1,
    mandatory: true,
    tasksRequired: 0
  };

  it('accepts any string as the task type', () => {
    expect(baseTaskSchema.parse(base)).toEqual(base);
  });

  it('rejects an empty title', () => {
    expect(messagesFor(baseTaskSchema, { ...base, title: '' })).toEqual([
      'Title is required'
    ]);
  });

  it('rejects a value below one', () => {
    expect(messagesFor(baseTaskSchema, { ...base, value: 0 })).toEqual([
      'Minimum value is 1'
    ]);
  });

  it('accepts fractional values of at least one', () => {
    expect(baseTaskSchema.safeParse({ ...base, value: 1.5 }).success).toBe(
      true
    );
  });

  it('accepts a negative number of required tasks', () => {
    expect(
      baseTaskSchema.safeParse({ ...base, tasksRequired: -3 }).success
    ).toBe(true);
  });

  it('requires the mandatory flag', () => {
    const rest: Record<string, unknown> = { ...base };
    delete rest.mandatory;

    expect(messagesFor(baseTaskSchema, rest)).toEqual(['Required']);
  });
});

describe('afterVisitSchema', () => {
  it.each([1, 300])('accepts a delay of %i seconds', (seconds) => {
    expect(afterVisitSchema.parse({ type: 'DELAY', seconds })).toEqual({
      type: 'DELAY',
      seconds
    });
  });

  it('rejects a delay shorter than one second', () => {
    expect(
      messagesFor(afterVisitSchema, { type: 'DELAY', seconds: 0 })
    ).toEqual(['Seconds must be at least 1']);
  });

  it('rejects a delay longer than 300 seconds', () => {
    expect(
      messagesFor(afterVisitSchema, { type: 'DELAY', seconds: 301 })
    ).toEqual(['Seconds cannot exceed 300']);
  });

  it('accepts a text question', () => {
    const value = { type: 'QUESTION', question: 'Why?', input: 'TEXT' };

    expect(afterVisitSchema.parse(value)).toEqual(value);
  });

  it('rejects an empty question', () => {
    expect(
      messagesFor(afterVisitSchema, {
        type: 'QUESTION',
        question: '',
        input: 'TEXT'
      })
    ).toEqual(['Question is required']);
  });

  it('rejects a question input other than TEXT', () => {
    expect(
      afterVisitSchema.safeParse({
        type: 'QUESTION',
        question: 'Why?',
        input: 'NUMBER'
      }).success
    ).toBe(false);
  });

  it('accepts an instant completion', () => {
    expect(afterVisitSchema.parse({ type: 'INSTANT' })).toEqual({
      type: 'INSTANT'
    });
  });

  it('rejects an unknown after visit type', () => {
    const result = afterVisitSchema.safeParse({ type: 'LATER' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].code).toBe('invalid_union_discriminator');
  });
});

describe('validationSchema', () => {
  it.each(['NONE', 'STRICT'])('accepts the %s validation mode', (type) => {
    expect(validationSchema.parse({ type })).toEqual({ type });
  });

  it('rejects an unknown validation mode', () => {
    expect(validationSchema.safeParse({ type: 'LOOSE' }).success).toBe(false);
  });
});

describe('taskSchema', () => {
  it('has one option per task type with a unique discriminator', () => {
    const types = taskSchema.options.map((option) => option.shape.type.value);

    expect(types).toHaveLength(45);
    expect(new Set(types).size).toBe(45);
    expect(sorted(types)).toEqual(sorted(TASK_TYPES));
  });

  it.each(TASK_TYPES)('accepts a valid %s task unchanged', (type) => {
    expect(taskSchema.parse(VALID_TASKS[type])).toEqual(VALID_TASKS[type]);
  });

  it('strips keys that are not part of the task type', () => {
    const parsed = taskSchema.parse({
      ...VALID_TASKS.BONUS_TASK,
      href: 'https://example.com',
      extra: true
    });

    expect(parsed).toEqual(VALID_TASKS.BONUS_TASK);
  });

  it('rejects an unknown task type', () => {
    const result = taskSchema.safeParse({
      ...VALID_TASKS.BONUS_TASK,
      type: 'UNKNOWN'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].code).toBe('invalid_union_discriminator');
  });

  it('rejects a task without a type', () => {
    expect(
      taskSchema.safeParse(withoutField('BONUS_TASK', 'type')).success
    ).toBe(false);
  });

  it('applies base task rules to every task type', () => {
    expect(messagesFor(taskSchema, withField('VISIT_URL', 'value', 0))).toEqual(
      ['Minimum value is 1']
    );
  });
});

type UrlFieldCase = {
  name: string;
  schema: z.ZodTypeAny;
  type: TaskType;
  field: string;
  requiredMessage: string;
  formatMessage: string;
  valid: string[];
  invalid: string[];
};

const X_PROFILE_ERROR = 'Unexpected URL, should be like https://x.com/username';
const X_STATUS_ERROR =
  'Unexpected URL, should be like https://x.com/username/status/1234567890';
const BLUESKY_POST_ERROR =
  'Unexpected URL, should be like https://bsky.app/profile/username.bsky.social/post/postId/';
const INSTAGRAM_POST_ERROR =
  'Unexpected URL, should be like https://www.instagram.com/p/POST_ID/ or https://www.instagram.com/username/p/POST_ID/';

const tweetCase = (
  name: string,
  schema: z.ZodTypeAny,
  type: TaskType
): UrlFieldCase => ({
  name,
  schema,
  type,
  field: 'tweetId',
  requiredMessage: 'Post URL is required',
  formatMessage: X_STATUS_ERROR,
  valid: [
    TWEET_URL,
    'http://www.x.com/a/status/1',
    'https://x.com/Dog_15CharsLong/status/9'
  ],
  invalid: [
    'https://twitter.com/giveawaydog/status/123',
    'https://x.com/giveawaydog/status/123?s=20',
    'https://x.com/giveawaydog/status/abc',
    'https://x.com/giveawaydog',
    `https://x.com/${'a'.repeat(16)}/status/1`
  ]
});

const blueskyPostCase = (
  name: string,
  schema: z.ZodTypeAny,
  type: TaskType
): UrlFieldCase => ({
  name,
  schema,
  type,
  field: 'postUrl',
  requiredMessage: 'Bluesky Post URL is required',
  formatMessage: BLUESKY_POST_ERROR,
  valid: [
    BLUESKY_POST_URL,
    'https://bsky.app/profile/did:plc:abc123/post/3kxyz/',
    'http://bsky.app/profile/custom.domain.com/post/abc'
  ],
  invalid: [
    'https://bsky.app/profile/giveawaydog.bsky.social',
    'https://bsky.app/profile/nodot/post/abc',
    'https://staging.bsky.app/profile/a.b/post/c'
  ]
});

const instagramPostCase = (
  name: string,
  schema: z.ZodTypeAny,
  type: TaskType
): UrlFieldCase => ({
  name,
  schema,
  type,
  field: 'postUrl',
  requiredMessage: 'Instagram Post URL is required',
  formatMessage: INSTAGRAM_POST_ERROR,
  valid: [
    INSTAGRAM_POST_URL,
    'https://instagram.com/dog.lover/p/ABC-_1',
    'https://www.instagram.com/p/ABC?igsh=xyz',
    'http://instagram.com/p/ABC'
  ],
  invalid: [
    'https://www.instagram.com/reel/ABC/',
    'https://www.instagram.com/p/',
    'https://www.instagram.com/tv/ABC'
  ]
});

const URL_FIELD_CASES: UrlFieldCase[] = [
  {
    name: 'twitter follow username',
    schema: twitterFollowTaskSchema,
    type: 'TWITTER_FOLLOW',
    field: 'username',
    requiredMessage: 'Profile URL is required',
    formatMessage: X_PROFILE_ERROR,
    valid: [
      'https://x.com/giveawaydog',
      'http://www.x.com/dog_123',
      `https://x.com/${'a'.repeat(16)}`
    ],
    invalid: [
      'https://twitter.com/giveawaydog',
      'https://x.com/giveawaydog/',
      `https://x.com/${'a'.repeat(17)}`,
      'https://x.com/give-away'
    ]
  },
  tweetCase('twitter retweet', twitterRetweetTaskSchema, 'TWITTER_RETWEET'),
  tweetCase(
    'twitter retweet import',
    twitterRetweetImportTaskSchema,
    'TWITTER_RETWEET_IMPORT'
  ),
  tweetCase(
    'twitter retweet import v2',
    twitterRetweetV2ImportTaskSchema,
    'TWITTER_RETWEET_IMPORT_V2'
  ),
  tweetCase('twitter like', twitterLikeTaskSchema, 'TWITTER_LIKE'),
  tweetCase(
    'twitter like import',
    twitterLikeImportTaskSchema,
    'TWITTER_LIKE_IMPORT'
  ),
  {
    name: 'steam wishlist app',
    schema: steamWishlistTaskSchema,
    type: 'STEAM_WISHLIST',
    field: 'appId',
    requiredMessage: 'Steam App URL is required',
    formatMessage:
      'Unexpected URL, should be like https://store.steampowered.com/app/APP_ID or https://store.steampowered.com/app/APP_ID/app_name',
    valid: [
      'https://store.steampowered.com/app/123',
      'https://store.steampowered.com/app/123/',
      'https://store.steampowered.com/app/123/My_Game-2/',
      'https://store.steampowered.com/app/123?l=english',
      'http://store.steampowered.com/app/123/My_Game?snr=1'
    ],
    invalid: [
      'https://store.steampowered.com/app/abc',
      'https://steamcommunity.com/app/123',
      'https://store.steampowered.com/app/123/name/extra',
      'https://www.store.steampowered.com/app/123'
    ]
  },
  {
    name: 'steam follow developer',
    schema: steamFollowTaskSchema,
    type: 'STEAM_FOLLOW',
    field: 'developer',
    requiredMessage: 'Steam Developer/Publisher URL is required',
    formatMessage:
      'Unexpected URL, should be like https://store.steampowered.com/developer/DeveloperName or https://store.steampowered.com/publisher/PublisherName',
    valid: [
      'https://store.steampowered.com/developer/Valve',
      'https://store.steampowered.com/publisher/Devolver_Digital/',
      'http://store.steampowered.com/curator/12345-Curator?snr=1'
    ],
    invalid: [
      'https://store.steampowered.com/franchise/Valve',
      'https://store.steampowered.com/developer/Valve/about',
      'https://store.steampowered.com/developer/'
    ]
  },
  {
    name: 'discord join invite',
    schema: discordJoinTaskSchema,
    type: 'DISCORD_JOIN',
    field: 'invite',
    requiredMessage: 'Discord Invite Link is required',
    formatMessage:
      'Unexpected URL, should be like https://discord.gg/inviteCode',
    valid: [
      'https://discord.gg/abc123',
      'http://www.discord.gg/ABC',
      'https://discordapp.com/invite/abc'
    ],
    invalid: [
      'https://discord.com/invite/abc',
      'https://discord.gg/abc-def',
      'https://discord.gg/abc/'
    ]
  },
  {
    name: 'discord join channel',
    schema: discordJoinTaskSchema,
    type: 'DISCORD_JOIN',
    field: 'channel',
    requiredMessage: 'Public Channel URL is required',
    formatMessage:
      'Unexpected URL, should be like https://discord.com/channels/guildId/channelId or https://discordapp.com/channels/guildId/channelId',
    valid: [
      'https://discord.com/channels/111/222',
      'https://www.discordapp.com/channels/1/2',
      'http://discord.com/channels/111/222'
    ],
    invalid: [
      'https://discord.com/channels/111/222/333',
      'https://discord.com/channels/@me/222',
      'https://discord.gg/channels/1/2'
    ]
  },
  {
    name: 'discord interaction import link',
    schema: discordInteractionImportTaskSchema,
    type: 'DISCORD_INTERACTION_IMPORT',
    field: 'link',
    requiredMessage: 'Discord Message Link is required',
    formatMessage:
      'Unexpected URL, should be like https://discord.com/channels/{guildId}/{channelId}/{messageId} or https://discordapp.com/channels/{guildId}/{channelId}/{messageId}',
    valid: [
      'https://discord.com/channels/111/222/333',
      'http://www.discordapp.com/channels/1/2/3'
    ],
    invalid: [
      'https://discord.com/channels/111/222',
      'https://discord.com/channels/1/2/3/4',
      'https://discord.com/channels/1/2/abc'
    ]
  },
  {
    name: 'twitch follow channel',
    schema: twitchFollowTaskSchema,
    type: 'TWITCH_FOLLOW',
    field: 'channel',
    requiredMessage: 'Twitch Channel URL is required',
    formatMessage:
      'Unexpected URL, should be like https://www.twitch.tv/username',
    valid: [
      'https://www.twitch.tv/abcd',
      `https://twitch.tv/${'a'.repeat(25)}`,
      'http://twitch.tv/dog_lover'
    ],
    invalid: [
      'https://twitch.tv/abc',
      `https://twitch.tv/${'a'.repeat(26)}`,
      'https://www.twitch.tv/giveawaydog/',
      'https://m.twitch.tv/giveawaydog'
    ]
  },
  {
    name: 'kick follow channel',
    schema: kickFollowTaskSchema,
    type: 'KICK_FOLLOW',
    field: 'channel',
    requiredMessage: 'Kick Channel URL is required',
    formatMessage:
      'Unexpected URL, should be like https://www.kick.com/username',
    valid: [
      'https://kick.com/giveawaydog',
      'https://www.kick.com/abcd',
      'http://kick.com/giveawaydog',
      `https://kick.com/${'a'.repeat(25)}`
    ],
    invalid: [
      'https://kick.com/abc',
      `https://kick.com/${'a'.repeat(26)}`,
      'https://kick.com/giveawaydog/',
      'https://kick.tv/giveawaydog'
    ]
  },
  {
    name: 'youtube channel',
    schema: youtubeVisitTaskSchema,
    type: 'YOUTUBE_VISIT',
    field: 'channelUrl',
    requiredMessage: 'YouTube Channel URL is required',
    formatMessage:
      'Unexpected URL, should be like https://www.youtube.com/@username, https://www.youtube.com/username, or https://www.youtube.com/channel/CHANNEL_ID',
    valid: [
      'https://www.youtube.com/@giveawaydog',
      'https://www.youtube.com/channel/UCbTcSd0aoM0A0sxxz8TBD6w',
      'https://www.youtube.com/KensonPlays',
      'https://www.youtube.com/@giveawaydog?sub_confirmation=1',
      'http://youtube.com/@dog-lover'
    ],
    invalid: [
      'https://youtu.be/abc',
      'https://www.youtube.com/watch?v=abc',
      'https://www.youtube.com/@giveawaydog/videos',
      'https://m.youtube.com/@giveawaydog',
      'https://www.youtube.com/@giveawaydog?sub_confirmation=0'
    ]
  },
  {
    name: 'instagram profile',
    schema: instagramVisitTaskSchema,
    type: 'INSTAGRAM_VISIT',
    field: 'profileUrl',
    requiredMessage: 'Instagram Profile URL is required',
    formatMessage:
      'Unexpected URL, should be like https://www.instagram.com/username/',
    valid: [
      'https://www.instagram.com/giveawaydog/',
      'https://www.instagram.com/giveawaydog',
      'https://instagram.com/a',
      `http://instagram.com/${'a'.repeat(30)}`,
      'https://instagram.com/dog.lover_1'
    ],
    invalid: [
      `https://instagram.com/${'a'.repeat(31)}`,
      'https://www.instagram.com/giveawaydog/reels/',
      'https://instagram.com/giveawaydog?hl=en'
    ]
  },
  instagramPostCase(
    'instagram like',
    instagramLikeTaskSchema,
    'INSTAGRAM_LIKE'
  ),
  instagramPostCase(
    'instagram comment',
    instagramCommentTaskSchema,
    'INSTAGRAM_COMMENT'
  ),
  {
    name: 'facebook page',
    schema: facebookVisitPageTaskSchema,
    type: 'FACEBOOK_VISIT_PAGE',
    field: 'pageUrl',
    requiredMessage: 'Facebook Page URL is required or missing https://',
    formatMessage:
      'Unexpected URL, should be like https://www.facebook.com/yourpagename or https://www.facebook.com/profile.php?id=PAGE_ID or https://www.facebook.com/share/SHARE_ID',
    valid: [
      'https://www.facebook.com/giveawaydog',
      'https://facebook.com/profile.php?id=1000',
      'https://www.facebook.com/profile.php?id=abc',
      'https://www.facebook.com/people/Dog-Lover/123',
      'https://www.facebook.com/share/AbC123',
      'https://www.facebook.com/123456/',
      'https://www.facebook.com/giveawaydog?ref=bookmarks',
      'http://facebook.com/giveawaydog'
    ],
    invalid: [
      'https://m.facebook.com/giveawaydog',
      'https://www.facebook.com/giveawaydog/about',
      'https://www.fb.com/giveawaydog'
    ]
  },
  {
    name: 'facebook post',
    schema: facebookViewPostTaskSchema,
    type: 'FACEBOOK_VIEW_POST',
    field: 'postUrl',
    requiredMessage: 'Facebook Post URL is required',
    formatMessage:
      'Unexpected URL format. Please provide a valid Facebook post URL',
    valid: [
      'https://www.facebook.com/permalink.php?story_fbid=pfbid0abc&id=61584646297782',
      'https://facebook.com/permalink.php?story_fbid=abc&amp;id=1',
      'https://www.facebook.com/permalink.php?story_fbid=abc&id=1&extra=yes',
      'https://www.facebook.com/page.name/posts/123abc',
      'https://www.facebook.com/page-name/posts/123abc/',
      'https://www.facebook.com/photo.php?fbid=123&id=456',
      'https://www.facebook.com/photo.php?fbid=123&id=456&set=a.1',
      'https://www.facebook.com/photo.php?fbid=123&amp;id=456',
      'http://facebook.com/permalink.php?story_fbid=abc&id=1',
      'http://facebook.com/page/posts/123',
      'http://facebook.com/photo.php?fbid=1&id=2'
    ],
    invalid: [
      'https://www.facebook.com/page/posts/123?ref=share',
      'https://www.facebook.com/page/videos/123',
      'https://www.facebook.com/photo.php?fbid=abc&id=1',
      'https://www.facebook.com/permalink.php?story_fbid=abc'
    ]
  },
  {
    name: 'tiktok profile',
    schema: tiktokFollowTaskSchema,
    type: 'TIKTOK_FOLLOW',
    field: 'profileUrl',
    requiredMessage: 'TikTok Profile URL is required',
    formatMessage:
      'Unexpected URL, should be like https://www.tiktok.com/@username/',
    valid: [
      'https://www.tiktok.com/@giveawaydog',
      'https://tiktok.com/@dog.lover_1/',
      'http://tiktok.com/@giveawaydog',
      `https://www.tiktok.com/@${'a'.repeat(30)}`
    ],
    invalid: [
      'https://www.tiktok.com/giveawaydog',
      'https://www.tiktok.com/@giveawaydog?lang=en',
      `https://www.tiktok.com/@${'a'.repeat(31)}`,
      'https://vm.tiktok.com/@giveawaydog'
    ]
  },
  {
    name: 'tiktok post',
    schema: tiktokLikeTaskSchema,
    type: 'TIKTOK_LIKE',
    field: 'postUrl',
    requiredMessage: 'TikTok Post URL is required',
    formatMessage:
      'Unexpected URL, should be like https://www.tiktok.com/@username/video/1234567890/ or https://www.tiktok.com/@username/photo/1234567890/',
    valid: [
      'https://www.tiktok.com/@giveawaydog/video/1234567890',
      'https://tiktok.com/@dog.lover/photo/1/',
      'https://www.tiktok.com/@giveawaydog/video/1234567890?is_from_webapp=1',
      'http://tiktok.com/@dog/video/1',
      `https://www.tiktok.com/@${'a'.repeat(30)}/video/1`
    ],
    invalid: [
      'https://www.tiktok.com/@giveawaydog/live',
      `https://www.tiktok.com/@${'a'.repeat(31)}/video/1`,
      'https://www.tiktok.com/@giveawaydog/video/abc',
      'https://www.tiktok.com/giveawaydog/video/123'
    ]
  },
  blueskyPostCase('bluesky like', blueskyLikeTaskSchema, 'BLUESKY_LIKE'),
  blueskyPostCase('bluesky repost', blueskyRepostTaskSchema, 'BLUESKY_REPOST'),
  blueskyPostCase(
    'bluesky like import',
    blueskyLikeImportTaskSchema,
    'BLUESKY_LIKE_IMPORT'
  ),
  blueskyPostCase(
    'bluesky repost import',
    blueskyRepostImportTaskSchema,
    'BLUESKY_REPOST_IMPORT'
  ),
  {
    name: 'velora profile',
    schema: veloraFollowTaskSchema,
    type: 'VELORA_FOLLOW',
    field: 'profileUrl',
    requiredMessage: 'Velora Profile URL is required',
    formatMessage: 'Unexpected URL, should be like https://velora.tv/username',
    valid: [
      'https://velora.tv/giveawaydog',
      'https://www.velora.tv/dog.lover-1/',
      'http://velora.tv/giveawaydog'
    ],
    invalid: [
      'https://velora.com/giveawaydog',
      'https://velora.tv/giveawaydog/clips'
    ]
  },
  {
    name: 'linkedin profile',
    schema: linkedInFollowTaskSchema,
    type: 'LINKEDIN_FOLLOW',
    field: 'profileUrl',
    requiredMessage: 'LinkedIn Profile URL is required',
    formatMessage:
      'Unexpected URL, should be like https://www.linkedin.com/company/giveaway-dog or https://www.linkedin.com/in/username',
    valid: [
      'https://www.linkedin.com/company/giveaway-dog',
      'https://www.linkedin.com/in/username/',
      'http://linkedin.com/in/dog_lover'
    ],
    invalid: [
      'https://www.linkedin.com/school/giveaway-dog',
      'https://www.linkedin.com/company/giveaway-dog/posts',
      'https://uk.linkedin.com/in/username'
    ]
  }
];

describe.each(URL_FIELD_CASES)(
  '$name URL validation',
  ({ schema, type, field, requiredMessage, formatMessage, valid, invalid }) => {
    it.each(valid)('accepts %s', (url) => {
      expect(messagesFor(schema, withField(type, field, url))).toEqual([]);
    });

    it.each(invalid)('rejects %s with the format message', (url) => {
      expect(messagesFor(schema, withField(type, field, url))).toEqual([
        formatMessage
      ]);
    });

    it('rejects a URL on another host that ends with a valid URL', () => {
      expect(
        messagesFor(
          schema,
          withField(type, field, `https://evil.example/${valid[0]}`)
        )
      ).toEqual([formatMessage]);
    });

    it('reports both the required and format messages for a non-URL string', () => {
      expect(messagesFor(schema, withField(type, field, 'not a url'))).toEqual([
        requiredMessage,
        formatMessage
      ]);
    });

    it('requires the field', () => {
      expect(messagesFor(schema, withoutField(type, field))).toEqual([
        'Required'
      ]);
    });
  }
);

type MinimumCase = [
  string,
  z.ZodTypeAny,
  Record<string, unknown>,
  string,
  number,
  string
];

const NUMBER_MINIMUM_CASES: MinimumCase[] = [
  [
    'task value',
    bonusTaskSchema,
    VALID_TASKS.BONUS_TASK,
    'value',
    1,
    'Minimum value is 1'
  ],
  [
    'limited bonus entrants',
    bonusLimitedTaskSchema,
    VALID_TASKS.BONUS_LIMITED,
    'maxEntrants',
    1,
    'Limit must be at least 1'
  ],
  [
    'loyalty requirement',
    bonusLoyaltyTaskSchema,
    VALID_TASKS.BONUS_LOYALTY,
    'loyaltyRequired',
    1,
    'Must be at least 1'
  ],
  [
    'minimum selections',
    multipleChoiceTaskSchema,
    VALID_TASKS.MULTIPLE_CHOICE,
    'minSelections',
    1,
    'Minimum selections must be at least 1'
  ],
  [
    'maximum selections',
    multipleChoiceTaskSchema,
    VALID_TASKS.MULTIPLE_CHOICE,
    'maxSelections',
    1,
    'Maximum selections must be at least 1'
  ],
  [
    'retweet import verified bonus',
    twitterRetweetImportTaskSchema,
    VALID_TASKS.TWITTER_RETWEET_IMPORT,
    'verifiedBonus',
    1,
    'Verified bonus must be at least 1'
  ],
  [
    'like import verified bonus',
    twitterLikeImportTaskSchema,
    VALID_TASKS.TWITTER_LIKE_IMPORT,
    'verifiedBonus',
    1,
    'Verified bonus must be at least 1'
  ],
  [
    'referral maximum',
    referralLinkTaskSchema,
    VALID_TASKS.REFERRAL_LINK,
    'maximum',
    1,
    'Maximum referrals must be at least 1'
  ],
  [
    'after visit delay',
    afterVisitSchema,
    { type: 'DELAY', seconds: 10 },
    'seconds',
    1,
    'Seconds must be at least 1'
  ]
];

describe.each(NUMBER_MINIMUM_CASES)(
  '%s minimum',
  (_name, schema, base, field, minimum, message) => {
    it('accepts the minimum value', () => {
      expect(messagesFor(schema, { ...base, [field]: minimum })).toEqual([]);
    });

    it('rejects a value just below the minimum with its message', () => {
      expect(messagesFor(schema, { ...base, [field]: minimum - 1 })).toEqual([
        message
      ]);
    });
  }
);

const STRING_MINIMUM_CASES: MinimumCase[] = [
  [
    'task title',
    bonusTaskSchema,
    VALID_TASKS.BONUS_TASK,
    'title',
    1,
    'Title is required'
  ],
  [
    'visit url label',
    visitUrlTaskSchema,
    VALID_TASKS.VISIT_URL,
    'label',
    3,
    'Label is required'
  ],
  [
    'ask question question',
    askQuestionTaskSchema,
    VALID_TASKS.ASK_QUESTION,
    'question',
    1,
    'Question is required'
  ],
  [
    'single choice question',
    singleChoiceTaskSchema,
    VALID_TASKS.SINGLE_CHOICE,
    'question',
    1,
    'Question is required'
  ],
  [
    'multiple choice question',
    multipleChoiceTaskSchema,
    VALID_TASKS.MULTIPLE_CHOICE,
    'question',
    1,
    'Question is required'
  ],
  [
    'after visit question',
    afterVisitSchema,
    { type: 'QUESTION', question: 'Why?', input: 'TEXT' },
    'question',
    1,
    'Question is required'
  ],
  [
    'retweet import importing account',
    twitterRetweetImportTaskSchema,
    VALID_TASKS.TWITTER_RETWEET_IMPORT,
    'importingAccount',
    1,
    'Importing account is required'
  ],
  [
    'like import importing account',
    twitterLikeImportTaskSchema,
    VALID_TASKS.TWITTER_LIKE_IMPORT,
    'importingAccount',
    1,
    'Importing account is required'
  ],
  [
    'twitch chat importing account',
    twitchChatImportTaskSchema,
    VALID_TASKS.TWITCH_CHAT_IMPORT,
    'importingAccount',
    1,
    'Importing account is required'
  ],
  [
    'bluesky like import importing account',
    blueskyLikeImportTaskSchema,
    VALID_TASKS.BLUESKY_LIKE_IMPORT,
    'importingAccount',
    1,
    'Importing account is required'
  ],
  [
    'bluesky repost import importing account',
    blueskyRepostImportTaskSchema,
    VALID_TASKS.BLUESKY_REPOST_IMPORT,
    'importingAccount',
    1,
    'Importing account is required'
  ],
  [
    'secret code',
    secretCodeTaskSchema,
    VALID_TASKS.SECRET_CODE,
    'code',
    1,
    'Secret code is required'
  ],
  [
    'secret code input',
    TASK_INPUT_SCHEMA.SECRET_CODE,
    {},
    'code',
    1,
    'Secret code is required'
  ],
  [
    'secret code v2 input',
    TASK_INPUT_SCHEMA.SECRET_CODE_V2,
    {},
    'code',
    1,
    'Secret code is required'
  ],
  [
    'ask question answer input',
    TASK_INPUT_SCHEMA.ASK_QUESTION,
    {},
    'answer',
    1,
    'Answer is required'
  ],
  [
    'single choice input',
    TASK_INPUT_SCHEMA.SINGLE_CHOICE,
    {},
    'choice',
    1,
    'Please select an option'
  ]
];

describe.each(STRING_MINIMUM_CASES)(
  '%s length',
  (_name, schema, base, field, minimum, message) => {
    it('accepts a value of exactly the minimum length', () => {
      expect(
        messagesFor(schema, { ...base, [field]: 'x'.repeat(minimum) })
      ).toEqual([]);
    });

    it('rejects a value one character too short with its message', () => {
      expect(
        messagesFor(schema, { ...base, [field]: 'x'.repeat(minimum - 1) })
      ).toEqual([message]);
    });
  }
);

const ARRAY_MINIMUM_CASES: [
  string,
  z.ZodTypeAny,
  Record<string, unknown>,
  string,
  unknown[],
  string
][] = [
  [
    'single choice options',
    singleChoiceTaskSchema,
    VALID_TASKS.SINGLE_CHOICE,
    'options',
    ['A', 'B'],
    'At least two options are required'
  ],
  [
    'multiple choice options',
    multipleChoiceTaskSchema,
    VALID_TASKS.MULTIPLE_CHOICE,
    'options',
    ['A', 'B'],
    'At least two options are required'
  ],
  [
    'secret codes',
    secretCodeV2TaskSchema,
    VALID_TASKS.SECRET_CODE_V2,
    'codes',
    ['W'],
    'At least one secret code is required'
  ],
  [
    'accepted media types',
    submitMediaTaskSchema,
    VALID_TASKS.SUBMIT_MEDIA,
    'acceptedTypes',
    ['IMAGE'],
    'At least one media type is required'
  ],
  [
    'multiple choice input',
    TASK_INPUT_SCHEMA.MULTIPLE_CHOICE,
    {},
    'choices',
    ['R'],
    'Please select at least one option'
  ]
];

describe.each(ARRAY_MINIMUM_CASES)(
  '%s count',
  (_name, schema, base, field, minimal, message) => {
    it('accepts the smallest allowed list', () => {
      expect(schema.parse({ ...base, [field]: minimal })[field]).toEqual(
        minimal
      );
    });

    it('rejects a list one item short with its message', () => {
      expect(
        messagesFor(schema, { ...base, [field]: minimal.slice(1) })
      ).toEqual([message]);
    });
  }
);

describe('bonus task schemas', () => {
  it('accepts a plain bonus task', () => {
    expect(bonusTaskSchema.parse(VALID_TASKS.BONUS_TASK)).toEqual(
      VALID_TASKS.BONUS_TASK
    );
  });

  it('rejects a bonus task with another type literal', () => {
    expect(
      bonusTaskSchema.safeParse({
        ...VALID_TASKS.BONUS_TASK,
        type: 'BONUS_TIMED'
      }).success
    ).toBe(false);
  });

  it.each([null, undefined, 'not a date'])(
    'accepts a timed bonus with a %s start date',
    (startDate) => {
      expect(
        messagesFor(
          bonusTimedTaskSchema,
          withField('BONUS_TIMED', 'startDate', startDate)
        )
      ).toEqual([]);
    }
  );

  it.each([null, undefined, 'not a date'])(
    'accepts a timed bonus with a %s end date',
    (endDate) => {
      expect(
        messagesFor(
          bonusTimedTaskSchema,
          withField('BONUS_TIMED', 'endDate', endDate)
        )
      ).toEqual([]);
    }
  );

  it('rejects a timed bonus with a numeric start date', () => {
    expect(
      messagesFor(
        bonusTimedTaskSchema,
        withField('BONUS_TIMED', 'startDate', 1767225600000)
      )
    ).toEqual(['Expected string, received number']);
  });

  it('accepts a timed bonus that ends before it starts', () => {
    expect(
      bonusTimedTaskSchema.safeParse({
        ...VALID_TASKS.BONUS_TIMED,
        startDate: '2026-02-01',
        endDate: '2026-01-01'
      }).success
    ).toBe(true);
  });

  it('rejects a limited bonus with a limit below one', () => {
    expect(
      messagesFor(
        bonusLimitedTaskSchema,
        withField('BONUS_LIMITED', 'maxEntrants', 0)
      )
    ).toEqual(['Limit must be at least 1']);
  });

  it('requires a limit on a limited bonus', () => {
    expect(
      messagesFor(
        bonusLimitedTaskSchema,
        withoutField('BONUS_LIMITED', 'maxEntrants')
      )
    ).toEqual(['Required']);
  });

  it('allows at most five loyalty tiers', () => {
    expect(MAX_ALLOWED_LOYALTY_TIERS).toBe(5);
  });

  it('rejects a loyalty bonus requiring fewer than one prior entry', () => {
    expect(
      messagesFor(
        bonusLoyaltyTaskSchema,
        withField('BONUS_LOYALTY', 'loyaltyRequired', 0)
      )
    ).toEqual(['Must be at least 1']);
  });

  it('accepts a loyalty requirement above the tier limit', () => {
    expect(
      messagesFor(
        bonusLoyaltyTaskSchema,
        withField(
          'BONUS_LOYALTY',
          'loyaltyRequired',
          MAX_ALLOWED_LOYALTY_TIERS + 1
        )
      )
    ).toEqual([]);
  });

  it('accepts a complete profile bonus', () => {
    expect(
      bonusCompleteProfileTaskSchema.parse(VALID_TASKS.BONUS_COMPLETE_PROFILE)
    ).toEqual(VALID_TASKS.BONUS_COMPLETE_PROFILE);
  });
});

describe('visitUrlTaskSchema', () => {
  it('rejects an invalid href with the default zod message', () => {
    expect(
      messagesFor(visitUrlTaskSchema, withField('VISIT_URL', 'href', 'nope'))
    ).toEqual(['Invalid url']);
  });

  it('accepts any URL scheme for the href', () => {
    expect(
      messagesFor(
        visitUrlTaskSchema,
        withField('VISIT_URL', 'href', 'mailto:dog@example.com')
      )
    ).toEqual([]);
  });

  it('accepts a javascript scheme href', () => {
    expect(
      messagesFor(
        visitUrlTaskSchema,
        withField('VISIT_URL', 'href', 'javascript:alert(1)')
      )
    ).toEqual([]);
  });

  it('rejects a label shorter than three characters', () => {
    expect(
      messagesFor(visitUrlTaskSchema, withField('VISIT_URL', 'label', 'Go'))
    ).toEqual(['Label is required']);
  });

  it('accepts an after visit delay', () => {
    const parsed = visitUrlTaskSchema.parse(
      withField('VISIT_URL', 'afterVisit', { type: 'DELAY', seconds: 10 })
    );

    expect(parsed.afterVisit).toEqual({ type: 'DELAY', seconds: 10 });
  });

  it('rejects an invalid after visit configuration', () => {
    expect(
      messagesFor(
        visitUrlTaskSchema,
        withField('VISIT_URL', 'afterVisit', { type: 'DELAY', seconds: 0 })
      )
    ).toEqual(['Seconds must be at least 1']);
  });
});

describe('question task schemas', () => {
  it('rejects an empty question to ask', () => {
    expect(
      messagesFor(
        askQuestionTaskSchema,
        withField('ASK_QUESTION', 'question', '')
      )
    ).toEqual(['Question is required']);
  });

  it('keeps optional placeholder and instructions', () => {
    const parsed = askQuestionTaskSchema.parse({
      ...VALID_TASKS.ASK_QUESTION,
      placeholder: 'Type here',
      instructions: 'Be honest'
    });

    expect(parsed).toMatchObject({
      placeholder: 'Type here',
      instructions: 'Be honest'
    });
  });

  it.each([
    ['single choice', singleChoiceTaskSchema, 'SINGLE_CHOICE'],
    ['multiple choice', multipleChoiceTaskSchema, 'MULTIPLE_CHOICE']
  ] as const)('rejects a %s task with one option', (_name, schema, type) => {
    expect(messagesFor(schema, withField(type, 'options', ['Only']))).toEqual([
      'At least two options are required'
    ]);
  });

  it.each([
    ['single choice', singleChoiceTaskSchema, 'SINGLE_CHOICE'],
    ['multiple choice', multipleChoiceTaskSchema, 'MULTIPLE_CHOICE']
  ] as const)(
    'rejects a %s task with an empty option',
    (_name, schema, type) => {
      expect(
        messagesFor(schema, withField(type, 'options', ['A', '']))
      ).toEqual(['Option cannot be empty']);
    }
  );

  it.each([
    ['single choice', singleChoiceTaskSchema, 'SINGLE_CHOICE'],
    ['multiple choice', multipleChoiceTaskSchema, 'MULTIPLE_CHOICE']
  ] as const)(
    'rejects a %s task with an empty question',
    (_name, schema, type) => {
      expect(messagesFor(schema, withField(type, 'question', ''))).toEqual([
        'Question is required'
      ]);
    }
  );

  it('rejects minimum selections below one', () => {
    expect(
      messagesFor(
        multipleChoiceTaskSchema,
        withField('MULTIPLE_CHOICE', 'minSelections', 0)
      )
    ).toEqual(['Minimum selections must be at least 1']);
  });

  it('rejects maximum selections below one', () => {
    expect(
      messagesFor(
        multipleChoiceTaskSchema,
        withField('MULTIPLE_CHOICE', 'maxSelections', 0)
      )
    ).toEqual(['Maximum selections must be at least 1']);
  });

  it('accepts a minimum selection count above the maximum and the option count', () => {
    expect(
      multipleChoiceTaskSchema.safeParse({
        ...VALID_TASKS.MULTIPLE_CHOICE,
        minSelections: 9,
        maxSelections: 2
      }).success
    ).toBe(true);
  });
});

describe('submitMediaTaskSchema', () => {
  it('defaults the description when it is omitted', () => {
    expect(
      submitMediaTaskSchema.parse(withoutField('SUBMIT_MEDIA', 'description'))
        .description
    ).toBe('Submit the required media as proof.');
  });

  it('rejects an empty list of accepted media types', () => {
    expect(
      messagesFor(
        submitMediaTaskSchema,
        withField('SUBMIT_MEDIA', 'acceptedTypes', [])
      )
    ).toEqual(['At least one media type is required']);
  });

  it('rejects media types other than IMAGE', () => {
    expect(
      submitMediaTaskSchema.safeParse(
        withField('SUBMIT_MEDIA', 'acceptedTypes', ['VIDEO'])
      ).success
    ).toBe(false);
  });
});

describe('connect task schemas', () => {
  it.each([
    ['TWITTER_CONNECT', twitterConnectTaskSchema],
    ['BLUESKY_CONNECT', blueskyConnectTaskSchema],
    ['VELORA_CONNECT', veloraConnectTaskSchema],
    ['LINKEDIN_CONNECT', linkedInConnectTaskSchema]
  ] as const)('accepts a %s task with only base fields', (type, schema) => {
    expect(schema.parse(VALID_TASKS[type])).toEqual(VALID_TASKS[type]);
  });
});

describe('validation mode defaults', () => {
  it.each([
    ['TWITTER_FOLLOW', twitterFollowTaskSchema],
    ['TWITTER_RETWEET', twitterRetweetTaskSchema],
    ['STEAM_FOLLOW', steamFollowTaskSchema],
    ['TIKTOK_FOLLOW', tiktokFollowTaskSchema],
    ['TIKTOK_LIKE', tiktokLikeTaskSchema]
  ] as const)(
    'leaves validation undefined for %s when omitted instead of applying the STRICT default',
    (type, schema) => {
      const parsed = schema.parse(withoutField(type, 'validation'));

      expect(parsed.validation).toBeUndefined();
    }
  );

  it.each([
    ['TWITTER_FOLLOW', twitterFollowTaskSchema],
    ['TIKTOK_LIKE', tiktokLikeTaskSchema]
  ] as const)('keeps an explicit NONE validation for %s', (type, schema) => {
    const parsed = schema.parse(
      withField(type, 'validation', { type: 'NONE' })
    );

    expect(parsed.validation).toEqual({ type: 'NONE' });
  });

  it('rejects an unknown validation mode', () => {
    expect(
      twitterRetweetTaskSchema.safeParse(
        withField('TWITTER_RETWEET', 'validation', { type: 'LOOSE' })
      ).success
    ).toBe(false);
  });
});

describe('twitter import task schemas', () => {
  it.each([
    ['TWITTER_RETWEET_IMPORT', twitterRetweetImportTaskSchema],
    ['TWITTER_LIKE_IMPORT', twitterLikeImportTaskSchema]
  ] as const)('requires an importing account for %s', (type, schema) => {
    expect(
      messagesFor(schema, withField(type, 'importingAccount', ''))
    ).toEqual(['Importing account is required']);
  });

  it.each([
    ['TWITTER_RETWEET_IMPORT', twitterRetweetImportTaskSchema],
    ['TWITTER_LIKE_IMPORT', twitterLikeImportTaskSchema]
  ] as const)('rejects a verified bonus below one for %s', (type, schema) => {
    expect(messagesFor(schema, withField(type, 'verifiedBonus', 0))).toEqual([
      'Verified bonus must be at least 1'
    ]);
  });

  it.each([null, undefined, 5])(
    'accepts a %s verified bonus',
    (verifiedBonus) => {
      expect(
        messagesFor(
          twitterLikeImportTaskSchema,
          withField('TWITTER_LIKE_IMPORT', 'verifiedBonus', verifiedBonus)
        )
      ).toEqual([]);
    }
  );

  it('strips importing account and verified bonus from v2 retweet imports', () => {
    const parsed = twitterRetweetV2ImportTaskSchema.parse({
      ...VALID_TASKS.TWITTER_RETWEET_IMPORT_V2,
      importingAccount: 'account-1',
      verifiedBonus: 3
    });

    expect(parsed).toEqual(VALID_TASKS.TWITTER_RETWEET_IMPORT_V2);
  });
});

describe('steamFollowTaskSchema', () => {
  it('defaults requireProof to false', () => {
    expect(
      steamFollowTaskSchema.parse(withoutField('STEAM_FOLLOW', 'requireProof'))
        .requireProof
    ).toBe(false);
  });
});

describe('discord task schemas', () => {
  it('reports only the required message for an invite without a protocol', () => {
    expect(
      messagesFor(
        discordJoinTaskSchema,
        withField('DISCORD_JOIN', 'invite', 'discord.gg/abc123')
      )
    ).toEqual(['Discord Invite Link is required']);
  });

  it('accepts optional importing account and roles on interaction imports', () => {
    const parsed = discordInteractionImportTaskSchema.parse({
      ...VALID_TASKS.DISCORD_INTERACTION_IMPORT,
      importingAccount: '',
      roles: ['role-1']
    });

    expect(parsed).toMatchObject({ importingAccount: '', roles: ['role-1'] });
  });
});

describe('twitchChatImportTaskSchema', () => {
  const COMMAND_ERROR =
    'Unexpected command, should start with ! and contain only letters, numbers, and underscores';

  it('requires an importing account', () => {
    expect(
      messagesFor(
        twitchChatImportTaskSchema,
        withField('TWITCH_CHAT_IMPORT', 'importingAccount', '')
      )
    ).toEqual(['Importing account is required']);
  });

  it('accepts any channel URL string including an empty one', () => {
    expect(
      messagesFor(
        twitchChatImportTaskSchema,
        withField('TWITCH_CHAT_IMPORT', 'channelUrl', '')
      )
    ).toEqual([]);
  });

  it('reports both messages for an empty trigger', () => {
    expect(
      messagesFor(
        twitchChatImportTaskSchema,
        withField('TWITCH_CHAT_IMPORT', 'trigger', '')
      )
    ).toEqual(['Chat command is required', COMMAND_ERROR]);
  });

  it.each(['giveaway', '!give away', '!give-away', '!'])(
    'rejects the trigger %s',
    (trigger) => {
      expect(
        messagesFor(
          twitchChatImportTaskSchema,
          withField('TWITCH_CHAT_IMPORT', 'trigger', trigger)
        )
      ).toEqual([COMMAND_ERROR]);
    }
  );

  it('accepts a trigger with letters, numbers and underscores', () => {
    expect(
      messagesFor(
        twitchChatImportTaskSchema,
        withField('TWITCH_CHAT_IMPORT', 'trigger', '!Give_Away_2')
      )
    ).toEqual([]);
  });

  it.each([null, undefined])('accepts a %s rate limit', (rateLimit) => {
    expect(
      messagesFor(
        twitchChatImportTaskSchema,
        withField('TWITCH_CHAT_IMPORT', 'rateLimit', rateLimit)
      )
    ).toEqual([]);
  });

  it.each(['ms', 's', 'm', 'h', 'd'])(
    'accepts a rate limit window in %s',
    (unit) => {
      const rateLimit = { max: 1, window: { value: 5, unit } };

      expect(
        twitchChatImportTaskSchema.parse(
          withField('TWITCH_CHAT_IMPORT', 'rateLimit', rateLimit)
        ).rateLimit
      ).toEqual(rateLimit);
    }
  );

  it('accepts zero and negative rate limit numbers', () => {
    const rateLimit = { max: 0, window: { value: -1, unit: 's' } };

    expect(
      twitchChatImportTaskSchema.parse(
        withField('TWITCH_CHAT_IMPORT', 'rateLimit', rateLimit)
      ).rateLimit
    ).toEqual(rateLimit);
  });

  it('rejects a rate limit without a window', () => {
    expect(
      messagesFor(
        twitchChatImportTaskSchema,
        withField('TWITCH_CHAT_IMPORT', 'rateLimit', { max: 1 })
      )
    ).toEqual(['Required']);
  });

  it('rejects a rate limit window in weeks', () => {
    expect(
      twitchChatImportTaskSchema.safeParse(
        withField('TWITCH_CHAT_IMPORT', 'rateLimit', {
          max: 1,
          window: { value: 1, unit: 'w' }
        })
      ).success
    ).toBe(false);
  });
});

describe('secret code task schemas', () => {
  it('rejects an empty secret code', () => {
    expect(
      messagesFor(secretCodeTaskSchema, withField('SECRET_CODE', 'code', ''))
    ).toEqual(['Secret code is required']);
  });

  it.each([
    ['SECRET_CODE', secretCodeTaskSchema],
    ['SECRET_CODE_V2', secretCodeV2TaskSchema]
  ] as const)('defaults caseSensitive to false for %s', (type, schema) => {
    expect(
      schema.parse(withoutField(type, 'caseSensitive')).caseSensitive
    ).toBe(false);
  });

  it.each([
    ['SECRET_CODE', secretCodeTaskSchema],
    ['SECRET_CODE_V2', secretCodeV2TaskSchema]
  ] as const)('keeps a null caseSensitive for %s', (type, schema) => {
    expect(
      schema.parse(withField(type, 'caseSensitive', null)).caseSensitive
    ).toBeNull();
  });

  it('keeps an optional hint', () => {
    expect(
      secretCodeTaskSchema.parse(withField('SECRET_CODE', 'hint', 'Look up'))
        .hint
    ).toBe('Look up');
  });

  it('rejects an empty list of codes', () => {
    expect(
      messagesFor(
        secretCodeV2TaskSchema,
        withField('SECRET_CODE_V2', 'codes', [])
      )
    ).toEqual(['At least one secret code is required']);
  });

  it('rejects an empty code in the list', () => {
    expect(
      messagesFor(
        secretCodeV2TaskSchema,
        withField('SECRET_CODE_V2', 'codes', ['WOOF', ''])
      )
    ).toEqual(['Secret code is required']);
  });
});

describe('participantTaskSchema', () => {
  it('has one option per task type', () => {
    const types = participantTaskSchema.options.map(
      (option) => option.shape.type.value
    );

    expect(sorted(types)).toEqual(sorted(TASK_TYPES));
  });

  it.each(
    TASK_TYPES.filter(
      (type) => type !== 'SECRET_CODE' && type !== 'SECRET_CODE_V2'
    )
  )('keeps every field of a valid %s task', (type) => {
    expect(participantTaskSchema.parse(VALID_TASKS[type])).toEqual(
      VALID_TASKS[type]
    );
  });

  it('drops the code of a SECRET_CODE task', () => {
    const parsed = participantTaskSchema.parse({
      ...VALID_TASKS.SECRET_CODE,
      code: 'OPEN-SESAME-42',
      caseSensitive: true,
      hint: 'Said on stream'
    });

    expect(parsed).not.toHaveProperty('code');
    expect(parsed).toEqual({
      ...withoutField('SECRET_CODE', 'code'),
      caseSensitive: true,
      hint: 'Said on stream'
    });
  });

  it('drops the codes of a SECRET_CODE_V2 task', () => {
    const parsed = participantTaskSchema.parse({
      ...VALID_TASKS.SECRET_CODE_V2,
      codes: ['FIRST-CODE-77', 'SECOND-CODE-88'],
      caseSensitive: true,
      hint: 'In the post'
    });

    expect(parsed).not.toHaveProperty('codes');
    expect(parsed).toEqual({
      ...withoutField('SECRET_CODE_V2', 'codes'),
      caseSensitive: true,
      hint: 'In the post'
    });
  });
});

describe('youtubeVisitTaskSchema', () => {
  it('keeps the optional channel name and subscribe confirmation flag', () => {
    const parsed = youtubeVisitTaskSchema.parse({
      ...VALID_TASKS.YOUTUBE_VISIT,
      channelName: 'Giveaway Dog',
      subConfirmation: true
    });

    expect(parsed).toMatchObject({
      channelName: 'Giveaway Dog',
      subConfirmation: true
    });
  });
});

describe('facebookVisitPageTaskSchema', () => {
  it('requires an after visit configuration', () => {
    expect(
      messagesFor(
        facebookVisitPageTaskSchema,
        withoutField('FACEBOOK_VISIT_PAGE', 'afterVisit')
      )
    ).toEqual(['Required']);
  });
});

describe('blueskyFollowTaskSchema', () => {
  const PROFILE_ERROR =
    'Invalid Bluesky profile. Must be a handle (e.g., username.bsky.social) or profile URL (e.g., https://bsky.app/profile/username.bsky.social)';

  it.each([
    'giveawaydog.bsky.social',
    'https://bsky.app/profile/giveawaydog.bsky.social',
    'https://bsky.app/profile/did:plc:abc123/',
    'custom.domain.com'
  ])('accepts the profile %s', (profileUrl) => {
    expect(
      messagesFor(
        blueskyFollowTaskSchema,
        withField('BLUESKY_FOLLOW', 'profileUrl', profileUrl)
      )
    ).toEqual([]);
  });

  it.each([
    'a',
    'giveawaydog',
    '@giveawaydog.bsky.social',
    'https://bsky.app/profile/giveawaydog'
  ])('rejects the profile %s', (profileUrl) => {
    expect(
      messagesFor(
        blueskyFollowTaskSchema,
        withField('BLUESKY_FOLLOW', 'profileUrl', profileUrl)
      )
    ).toEqual([PROFILE_ERROR]);
  });

  it('reports both messages for an empty profile', () => {
    expect(
      messagesFor(
        blueskyFollowTaskSchema,
        withField('BLUESKY_FOLLOW', 'profileUrl', '')
      )
    ).toEqual(['Bluesky profile URL or handle is required', PROFILE_ERROR]);
  });
});

describe('bluesky import task schemas', () => {
  it.each([
    ['BLUESKY_LIKE_IMPORT', blueskyLikeImportTaskSchema],
    ['BLUESKY_REPOST_IMPORT', blueskyRepostImportTaskSchema]
  ] as const)('requires an importing account for %s', (type, schema) => {
    expect(
      messagesFor(schema, withField(type, 'importingAccount', ''))
    ).toEqual(['Importing account is required']);
  });
});

describe('referralLinkTaskSchema', () => {
  it.each([null, undefined, 1])('accepts a %s maximum', (maximum) => {
    expect(
      messagesFor(
        referralLinkTaskSchema,
        withField('REFERRAL_LINK', 'maximum', maximum)
      )
    ).toEqual([]);
  });

  it('rejects a maximum below one', () => {
    expect(
      messagesFor(
        referralLinkTaskSchema,
        withField('REFERRAL_LINK', 'maximum', 0)
      )
    ).toEqual(['Maximum referrals must be at least 1']);
  });
});

describe('TASK_LABEL', () => {
  it('has a non-empty label for every task type', () => {
    expect(Object.keys(TASK_LABEL).sort()).toEqual(sorted(TASK_TYPES));
    for (const type of TASK_TYPES) {
      expect(TASK_LABEL[type].length).toBeGreaterThan(0);
    }
  });

  it('marks exactly the deprecated task types as legacy', () => {
    const legacy = TASK_TYPES.filter((type) =>
      TASK_LABEL[type].endsWith('(Legacy)')
    ).sort();

    expect(legacy).toEqual(typesWhere(TASK_IS_DEPRECATED, true));
  });

  it('shares labels only between versions of the same task', () => {
    const byLabel = new Map<string, TaskType[]>();
    for (const type of TASK_TYPES) {
      byLabel.set(TASK_LABEL[type], [
        ...(byLabel.get(TASK_LABEL[type]) ?? []),
        type
      ]);
    }
    const shared = [...byLabel.entries()]
      .filter(([, types]) => types.length > 1)
      .map(([label, types]) => [label, types.sort()]);

    expect(Object.fromEntries(shared)).toEqual({
      'Enter Secret Code': ['SECRET_CODE', 'SECRET_CODE_V2'],
      'Repost on X': ['TWITTER_RETWEET', 'TWITTER_RETWEET_IMPORT_V2'],
      'Like a post on Bluesky': ['BLUESKY_LIKE', 'BLUESKY_LIKE_IMPORT'],
      'Repost on Bluesky': ['BLUESKY_REPOST', 'BLUESKY_REPOST_IMPORT']
    });
  });

  it('labels every task type with its display name', () => {
    expect(TASK_LABEL).toEqual({
      REFERRAL_LINK: 'Refer a Friend',
      BONUS_TASK: 'Bonus',
      BONUS_TIMED: 'Timed Bonus',
      BONUS_LIMITED: 'Limited Bonus',
      BONUS_LOYALTY: 'Loyalty Bonus',
      BONUS_COMPLETE_PROFILE: 'Complete Your Profile',
      VISIT_URL: 'Visit URL',
      ASK_QUESTION: 'Ask a Question',
      SINGLE_CHOICE: 'Single Choice',
      MULTIPLE_CHOICE: 'Multiple Choice',
      SUBMIT_MEDIA: 'Submit Media',
      SECRET_CODE: 'Enter Secret Code',
      SECRET_CODE_V2: 'Enter Secret Code',
      TWITTER_CONNECT: 'Connect X',
      TWITTER_FOLLOW: 'Follow on X',
      TWITTER_RETWEET: 'Repost on X',
      TWITTER_RETWEET_IMPORT: 'Repost on X (Legacy)',
      TWITTER_RETWEET_IMPORT_V2: 'Repost on X',
      TWITTER_LIKE: 'Like a post on X',
      TWITTER_LIKE_IMPORT: 'Like a post on X (Legacy)',
      STEAM_WISHLIST: 'Steam Wishlist',
      STEAM_FOLLOW: 'Follow on Steam',
      DISCORD_JOIN: 'Join Discord Server',
      DISCORD_INTERACTION_IMPORT: 'Interact on Discord',
      TWITCH_FOLLOW: 'Follow on Twitch',
      TWITCH_CHAT_IMPORT: 'Chat on Twitch',
      YOUTUBE_VISIT: 'Visit YouTube Channel',
      KICK_FOLLOW: 'Follow on Kick',
      INSTAGRAM_VISIT: 'Visit Instagram Profile',
      INSTAGRAM_LIKE: 'Like Instagram Post',
      INSTAGRAM_COMMENT: 'Comment on Instagram Post',
      FACEBOOK_VISIT_PAGE: 'Visit Facebook Page',
      FACEBOOK_VIEW_POST: 'View Facebook Post',
      TIKTOK_FOLLOW: 'Follow on TikTok',
      TIKTOK_LIKE: 'Like TikTok Post',
      BLUESKY_CONNECT: 'Connect Bluesky',
      BLUESKY_FOLLOW: 'Follow on Bluesky',
      BLUESKY_LIKE: 'Like a post on Bluesky',
      BLUESKY_REPOST: 'Repost on Bluesky',
      BLUESKY_LIKE_IMPORT: 'Like a post on Bluesky',
      BLUESKY_REPOST_IMPORT: 'Repost on Bluesky',
      VELORA_CONNECT: 'Connect Velora',
      VELORA_FOLLOW: 'Follow on Velora',
      LINKEDIN_CONNECT: 'Connect LinkedIn',
      LINKEDIN_FOLLOW: 'Follow on LinkedIn'
    });
  });
});

describe('TASK_INPUT_SCHEMA', () => {
  const TYPES_WITH_INPUT: TaskType[] = [
    'VISIT_URL',
    'STEAM_FOLLOW',
    'SECRET_CODE',
    'SECRET_CODE_V2',
    'ASK_QUESTION',
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'SUBMIT_MEDIA'
  ];

  it('defines an input schema for every task type', () => {
    expect(Object.keys(TASK_INPUT_SCHEMA).sort()).toEqual(sorted(TASK_TYPES));
  });

  it('only expects participant input for answer, code, choice and media tasks', () => {
    const withInput = TASK_TYPES.filter(
      (type) => Object.keys(TASK_INPUT_SCHEMA[type].shape).length > 0
    );

    expect(sorted(withInput)).toEqual(sorted(TYPES_WITH_INPUT));
  });

  it.each(TASK_TYPES.filter((type) => !TYPES_WITH_INPUT.includes(type)))(
    'accepts an empty input for %s and strips extra keys',
    (type) => {
      expect(TASK_INPUT_SCHEMA[type].parse({ extra: 'x' })).toEqual({});
    }
  );

  it.each([
    ['VISIT_URL', {}],
    ['VISIT_URL', { answer: 'Saw it' }],
    ['STEAM_FOLLOW', {}],
    ['STEAM_FOLLOW', { mediaUrl: 'https://cdn.example.com/proof.png' }],
    ['SECRET_CODE', { code: 'WOOF' }],
    ['SECRET_CODE_V2', { code: 'WOOF' }],
    ['ASK_QUESTION', { answer: 'Corgi' }],
    ['SINGLE_CHOICE', { choice: 'Red' }],
    ['MULTIPLE_CHOICE', { choices: ['Red'] }],
    ['SUBMIT_MEDIA', { mediaUrl: 'https://cdn.example.com/proof.png' }]
  ] as const)('accepts %s input %j', (type, input) => {
    expect(TASK_INPUT_SCHEMA[type].parse(input)).toEqual(input);
  });

  it.each([
    ['VISIT_URL', { answer: 1 }, 'Expected string, received number'],
    ['STEAM_FOLLOW', { mediaUrl: 'nope' }, 'Media URL is required'],
    ['SECRET_CODE', { code: '' }, 'Secret code is required'],
    ['SECRET_CODE', {}, 'Required'],
    ['SECRET_CODE_V2', { code: '' }, 'Secret code is required'],
    ['ASK_QUESTION', { answer: '' }, 'Answer is required'],
    ['SINGLE_CHOICE', { choice: '' }, 'Please select an option'],
    ['MULTIPLE_CHOICE', { choices: [] }, 'Please select at least one option'],
    ['MULTIPLE_CHOICE', { choices: [1] }, 'Expected string, received number'],
    ['ASK_QUESTION', {}, 'Required'],
    ['SINGLE_CHOICE', {}, 'Required'],
    ['SUBMIT_MEDIA', { mediaUrl: 'nope' }, 'Media URL is required'],
    ['SUBMIT_MEDIA', {}, 'Required']
  ] as const)('rejects %s input %j with %s', (type, input, message) => {
    expect(messagesFor(TASK_INPUT_SCHEMA[type], input)).toEqual([message]);
  });
});

describe('TASK_JOB_DATA_SCHEMA', () => {
  it('defines job data for every task type', () => {
    expect(Object.keys(TASK_JOB_DATA_SCHEMA).sort()).toEqual(
      sorted(TASK_TYPES)
    );
  });

  it.each([
    ['TWITTER_RETWEET_IMPORT', ['runs', 'lastProcessedId']],
    [
      'TWITTER_RETWEET_IMPORT_V2',
      ['runs', 'nextCursor', 'lastProcessedId', 'firstSeenId']
    ],
    ['TWITTER_LIKE_IMPORT', ['runs', 'lastProcessedId']],
    ['BLUESKY_LIKE_IMPORT', ['runs', 'lastProcessedDid']],
    ['BLUESKY_REPOST_IMPORT', ['runs', 'lastProcessedDid']]
  ] as const)('tracks %s job progress with %j', (type, keys) => {
    expect(Object.keys(TASK_JOB_DATA_SCHEMA[type].shape)).toEqual(keys);
  });

  it('has empty job data for every other task type', () => {
    const withData = TASK_TYPES.filter(
      (type) => Object.keys(TASK_JOB_DATA_SCHEMA[type].shape).length > 0
    );

    expect(sorted(withData)).toEqual(
      sorted([
        'TWITTER_RETWEET_IMPORT',
        'TWITTER_RETWEET_IMPORT_V2',
        'TWITTER_LIKE_IMPORT',
        'BLUESKY_LIKE_IMPORT',
        'BLUESKY_REPOST_IMPORT'
      ])
    );
  });

  describe.each([
    ['TWITTER_RETWEET_IMPORT', { runs: 3, lastProcessedId: '10' }],
    [
      'TWITTER_RETWEET_IMPORT_V2',
      {
        runs: 3,
        nextCursor: 'cursor-1',
        lastProcessedId: '10',
        firstSeenId: '20'
      }
    ],
    ['TWITTER_LIKE_IMPORT', { runs: 3, lastProcessedId: '10' }],
    ['BLUESKY_LIKE_IMPORT', { runs: 3, lastProcessedDid: 'did:plc:abc' }],
    ['BLUESKY_REPOST_IMPORT', { runs: 3, lastProcessedDid: 'did:plc:abc' }]
  ] as const)('%s job data', (type, data) => {
    const schema: z.ZodTypeAny = TASK_JOB_DATA_SCHEMA[type];
    const cursorKeys = Object.keys(data).filter((key) => key !== 'runs');

    it('keeps every progress field', () => {
      expect(schema.parse(data)).toEqual(data);
    });

    it('accepts the initial job data with zero runs', () => {
      expect(schema.parse({ runs: 0 })).toEqual({ runs: 0 });
    });

    it('rejects a negative run count', () => {
      expect(messagesFor(schema, { ...data, runs: -1 })).toEqual([
        'Number must be greater than or equal to 0'
      ]);
    });

    it('requires a run count', () => {
      expect(messagesFor(schema, {})).toEqual(['Required']);
    });

    it.each(cursorKeys)('rejects a numeric %s', (key) => {
      expect(messagesFor(schema, { ...data, [key]: 1 })).toEqual([
        'Expected string, received number'
      ]);
    });
  });
});

describe('taskPlatformSchema', () => {
  it.each([...IDENTITY_PROVIDERS, 'WEBSITE', 'BONUS', 'QUESTION'])(
    'accepts the %s platform',
    (platform) => {
      expect(taskPlatformSchema.parse(platform)).toBe(platform);
    }
  );

  it.each(['website', 'OTHER', ''])('rejects the %j platform', (platform) => {
    expect(taskPlatformSchema.safeParse(platform).success).toBe(false);
  });
});

describe('TASK_PLATFORM', () => {
  it.each([
    [
      'BONUS',
      [
        'BONUS_TASK',
        'BONUS_TIMED',
        'BONUS_LIMITED',
        'BONUS_LOYALTY',
        'BONUS_COMPLETE_PROFILE',
        'SECRET_CODE',
        'SECRET_CODE_V2',
        'REFERRAL_LINK'
      ]
    ],
    ['WEBSITE', ['VISIT_URL']],
    [
      'QUESTION',
      ['ASK_QUESTION', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SUBMIT_MEDIA']
    ],
    [
      'TWITTER',
      [
        'TWITTER_CONNECT',
        'TWITTER_FOLLOW',
        'TWITTER_RETWEET',
        'TWITTER_RETWEET_IMPORT',
        'TWITTER_RETWEET_IMPORT_V2',
        'TWITTER_LIKE',
        'TWITTER_LIKE_IMPORT'
      ]
    ],
    ['STEAM', ['STEAM_WISHLIST', 'STEAM_FOLLOW']],
    ['YOUTUBE', ['YOUTUBE_VISIT']],
    ['INSTAGRAM', ['INSTAGRAM_VISIT', 'INSTAGRAM_LIKE', 'INSTAGRAM_COMMENT']],
    ['FACEBOOK', ['FACEBOOK_VISIT_PAGE', 'FACEBOOK_VIEW_POST']],
    ['TIKTOK', ['TIKTOK_FOLLOW', 'TIKTOK_LIKE']],
    ['DISCORD', ['DISCORD_JOIN', 'DISCORD_INTERACTION_IMPORT']],
    ['TWITCH', ['TWITCH_FOLLOW', 'TWITCH_CHAT_IMPORT']],
    ['KICK', ['KICK_FOLLOW']],
    [
      'BLUESKY',
      [
        'BLUESKY_CONNECT',
        'BLUESKY_FOLLOW',
        'BLUESKY_LIKE',
        'BLUESKY_REPOST',
        'BLUESKY_LIKE_IMPORT',
        'BLUESKY_REPOST_IMPORT'
      ]
    ],
    ['VELORA', ['VELORA_CONNECT', 'VELORA_FOLLOW']],
    ['LINKEDIN', ['LINKEDIN_CONNECT', 'LINKEDIN_FOLLOW']]
  ] as const)('assigns the %s platform to %j', (platform, types) => {
    expect(typesWhere(TASK_PLATFORM, platform)).toEqual(sorted([...types]));
  });

  it('assigns a platform to every task type', () => {
    expect(Object.keys(TASK_PLATFORM).sort()).toEqual(sorted(TASK_TYPES));
  });
});

describe('TASK_IDENTITY_PROVIDER', () => {
  it('uses the task platform as the identity provider and ANONYMOUS for non-provider platforms', () => {
    for (const type of TASK_TYPES) {
      const platform = TASK_PLATFORM[type];
      const expected = ['BONUS', 'WEBSITE', 'QUESTION'].includes(platform)
        ? 'ANONYMOUS'
        : platform;

      expect([type, TASK_IDENTITY_PROVIDER[type]]).toEqual([type, expected]);
    }
  });

  it('assigns an identity provider to every task type', () => {
    expect(Object.keys(TASK_IDENTITY_PROVIDER).sort()).toEqual(
      sorted(TASK_TYPES)
    );
  });
});

describe('TASK_REQUIRED_SCOPES', () => {
  it.each(IDENTITY_PROVIDERS)(
    'reuses the provider required scopes for %s',
    (provider) => {
      expect(TASK_REQUIRED_SCOPES[provider]).toBe(
        PROVIDER_REQUIRED_SCOPES[provider]
      );
    }
  );

  it.each(['WEBSITE', 'BONUS', 'QUESTION'] as const)(
    'requires no scopes for the %s platform',
    (platform) => {
      expect(TASK_REQUIRED_SCOPES[platform]).toEqual([]);
    }
  );

  it('requires the twitter read scopes for twitter tasks', () => {
    expect(TASK_REQUIRED_SCOPES.TWITTER).toEqual([
      'users.read',
      'tweet.read',
      'offline.access'
    ]);
  });
});

describe('TASK_PLATFORM_LABEL', () => {
  it.each(IDENTITY_PROVIDERS)(
    'matches the identity provider label for %s',
    (provider) => {
      expect(TASK_PLATFORM_LABEL[provider]).toBe(
        IDENTITY_PROVIDER_LABEL[provider]
      );
    }
  );

  it('labels the non-provider platforms', () => {
    expect([
      TASK_PLATFORM_LABEL.WEBSITE,
      TASK_PLATFORM_LABEL.BONUS,
      TASK_PLATFORM_LABEL.QUESTION
    ]).toEqual(['Website', 'Bonus', 'Question']);
  });
});

describe('task categories', () => {
  it('defines the social, engagement and community categories', () => {
    expect(taskCategorySchema.options).toEqual([
      'social',
      'engagement',
      'community'
    ]);
  });

  it('labels each category', () => {
    expect(TASK_CATEGORY_LABEL).toEqual({
      social: 'Social',
      engagement: 'Engagement',
      community: 'Community'
    });
  });

  it('puts only steam tasks in the community category', () => {
    expect(typesWhere(TASK_CATEGORY, 'community')).toEqual(
      sorted(['STEAM_WISHLIST', 'STEAM_FOLLOW'])
    );
  });

  it('puts bonus, code, question and referral tasks in the engagement category', () => {
    expect(typesWhere(TASK_CATEGORY, 'engagement')).toEqual(
      sorted([
        'BONUS_TASK',
        'BONUS_TIMED',
        'BONUS_LIMITED',
        'BONUS_LOYALTY',
        'BONUS_COMPLETE_PROFILE',
        'VISIT_URL',
        'SECRET_CODE',
        'SECRET_CODE_V2',
        'ASK_QUESTION',
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'REFERRAL_LINK',
        'SUBMIT_MEDIA'
      ])
    );
  });

  it('puts every other task type in the social category', () => {
    expect(typesWhere(TASK_CATEGORY, 'social')).toHaveLength(
      TASK_TYPES.length - 15
    );
    expect(Object.keys(TASK_CATEGORY).sort()).toEqual(sorted(TASK_TYPES));
  });
});

describe('task flags', () => {
  it('flags every task type with IMPORT in its name as an import', () => {
    expect(typesWhere(TASK_IS_IMPORT, true)).toEqual(
      TASK_TYPES.filter((type) => type.includes('_IMPORT')).sort()
    );
  });

  it('prevents manual adds only for profile, legacy secret code and legacy twitter imports', () => {
    expect(typesWhere(TASK_ALLOW_MANUAL_ADD, false)).toEqual(
      sorted([
        'BONUS_COMPLETE_PROFILE',
        'SECRET_CODE',
        'TWITTER_RETWEET_IMPORT',
        'TWITTER_LIKE_IMPORT'
      ])
    );
  });

  it('restricts duplicates only for referral links', () => {
    expect(typesWhere(TASK_DUPLICATE_RESTRICTION, true)).toEqual([
      'REFERRAL_LINK'
    ]);
  });

  it('deprecates only the legacy twitter imports', () => {
    expect(typesWhere(TASK_IS_DEPRECATED, true)).toEqual(
      sorted(['TWITTER_RETWEET_IMPORT', 'TWITTER_LIKE_IMPORT'])
    );
  });

  it.each([
    ['TASK_IS_IMPORT', TASK_IS_IMPORT],
    ['TASK_ALLOW_MANUAL_ADD', TASK_ALLOW_MANUAL_ADD],
    ['TASK_DUPLICATE_RESTRICTION', TASK_DUPLICATE_RESTRICTION],
    ['TASK_IS_DEPRECATED', TASK_IS_DEPRECATED]
  ] as const)('%s covers every task type', (_name, map) => {
    expect(Object.keys(map).sort()).toEqual(sorted(TASK_TYPES));
  });
});

describe('TASK_VERIFICATION_REQUIREMENT', () => {
  it('marks only steam follow as self-reported', () => {
    expect(typesWhere(TASK_VERIFICATION_REQUIREMENT, 'self-reported')).toEqual([
      'STEAM_FOLLOW'
    ]);
  });

  it('verifies connections, imports, steam wishlist, discord, twitch, codes, bluesky and velora automatically', () => {
    expect(typesWhere(TASK_VERIFICATION_REQUIREMENT, 'automatic')).toEqual(
      sorted([
        'TWITTER_CONNECT',
        'TWITTER_RETWEET_IMPORT',
        'TWITTER_RETWEET_IMPORT_V2',
        'TWITTER_LIKE_IMPORT',
        'STEAM_WISHLIST',
        'DISCORD_JOIN',
        'DISCORD_INTERACTION_IMPORT',
        'TWITCH_FOLLOW',
        'TWITCH_CHAT_IMPORT',
        'SECRET_CODE',
        'SECRET_CODE_V2',
        'BLUESKY_CONNECT',
        'BLUESKY_FOLLOW',
        'BLUESKY_LIKE',
        'BLUESKY_REPOST',
        'BLUESKY_LIKE_IMPORT',
        'BLUESKY_REPOST_IMPORT',
        'VELORA_CONNECT',
        'VELORA_FOLLOW',
        'LINKEDIN_CONNECT'
      ])
    );
  });

  it('requires manual verification for every other task type', () => {
    expect(typesWhere(TASK_VERIFICATION_REQUIREMENT, 'manual')).toHaveLength(
      TASK_TYPES.length - 21
    );
    expect(Object.keys(TASK_VERIFICATION_REQUIREMENT).sort()).toEqual(
      sorted(TASK_TYPES)
    );
  });
});

describe('userEntriesSchema', () => {
  const user = {
    id: 'user-1',
    name: 'Dog Lover',
    email: 'dog@example.com',
    emailVerified: true,
    image: 'https://example.com/a.png',
    countryCode: 'US',
    userAgent: 'agent',
    birthday: null,
    qualityScore: 80,
    providers: [],
    source: 'SIGNUP',
    preferredContactMethod: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    isAnonymous: false
  };

  const entry = {
    id: 'entry-1',
    user,
    task: VALID_TASKS.BONUS_TASK,
    status: 'COMPLETED',
    proof: { anything: true },
    completedAt: 1767225600000
  };

  it('accepts an entry without a rejection reason', () => {
    const parsed = userEntriesSchema.parse(entry);

    expect(parsed.reason).toBeUndefined();
    expect(parsed.user.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it.each([null, 'Duplicate account'])(
    'accepts a %s rejection reason',
    (reason) => {
      expect(userEntriesSchema.parse({ ...entry, reason }).reason).toBe(reason);
    }
  );

  it('requires the completion time as a number', () => {
    expect(
      userEntriesSchema.safeParse({
        ...entry,
        completedAt: '2026-01-01T00:00:00.000Z'
      }).success
    ).toBe(false);
  });

  it('rejects an unknown completion status', () => {
    expect(
      userEntriesSchema.safeParse({ ...entry, status: 'DONE' }).success
    ).toBe(false);
  });
});

describe('toTaskSchema', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses the stored config using the stored task id', () => {
    const stored = storedTask(toStoredConfig(VALID_TASKS.KICK_FOLLOW), {
      id: 'task-42'
    });

    expect(toTaskSchema(stored)).toEqual({
      ...VALID_TASKS.KICK_FOLLOW,
      id: 'task-42'
    });
  });

  it('overrides an id stored inside the config', () => {
    const stored = storedTask(
      { ...VALID_TASKS.BONUS_TASK, id: 'stale-id' },
      { id: 'task-7' }
    );

    expect(toTaskSchema(stored).id).toBe('task-7');
  });

  it('applies schema defaults to the stored config', () => {
    const task = toTaskSchema(
      storedTask(withoutField('STEAM_FOLLOW', 'requireProof'))
    );

    expect(task).toMatchObject({ type: 'STEAM_FOLLOW', requireProof: false });
  });

  it.each([
    ['a null config', null],
    ['an array config', [VALID_TASKS.BONUS_TASK]],
    ['a string config', 'BONUS_TASK'],
    ['an invalid config', { ...VALID_TASKS.BONUS_TASK, title: '' }]
  ])('throws an internal server error for %s', (_name, config) => {
    const error = catchError(() => toTaskSchema(storedTask(config)));

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to parse task config'
    });
  });

  it('includes the zod error as the cause and logs it', () => {
    const appError = catchError(() =>
      toTaskSchema(storedTask({ type: 'UNKNOWN' }))
    ) as ApplicationError;

    expect(appError.cause).toBeInstanceOf(z.ZodError);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to parse task config:',
      appError.cause
    );
  });
});

describe('toTaskSchemaSafe', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the parsed task when the config is valid', () => {
    const stored = storedTask(toStoredConfig(VALID_TASKS.SECRET_CODE_V2), {
      id: 'task-3'
    });

    expect(toTaskSchemaSafe(stored)).toEqual({
      ...VALID_TASKS.SECRET_CODE_V2,
      id: 'task-3'
    });
  });

  it('returns an unknown one-entry bonus task when the config is invalid', () => {
    const stored = storedTask(null, { id: 'task-broken' });

    expect(toTaskSchemaSafe(stored)).toEqual({
      type: 'BONUS_TASK',
      id: 'task-broken',
      title: 'Unknown Task',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    });
  });
});

describe('twitter proof helpers', () => {
  const proof = {
    source: 'twitter_import' as const,
    twitterUserId: 'tw-1',
    twitterUsername: 'doglover',
    twitterVerified: true,
    importedAt: '2026-01-01T00:00:00.000Z',
    validatedBy: 'importer'
  };

  it('parses a valid twitter import proof', () => {
    expect(parseTwitterProofSchema(proof)).toEqual(proof);
  });

  it('strips unknown keys from the parsed proof', () => {
    expect(parseTwitterProofSchema({ ...proof, extra: 1 })).toEqual(proof);
  });

  it.each([
    ['a different source', { ...proof, source: 'manual' }],
    ['a missing verified flag', { ...proof, twitterVerified: undefined }],
    ['null', null],
    ['a string', 'twitter_import']
  ])('returns null for %s', (_name, data) => {
    expect(parseTwitterProofSchema(data)).toBeNull();
  });

  it('exposes the proof schema used by the parser', () => {
    expect(Object.keys(twitterProofSchema.shape)).toEqual([
      'source',
      'twitterUserId',
      'twitterUsername',
      'twitterVerified',
      'importedAt',
      'validatedBy'
    ]);
  });

  it('returns the same proof object from toTwitterProofSchema', () => {
    expect(toTwitterProofSchema(proof)).toBe(proof);
  });
});
