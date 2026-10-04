import type {
  Prisma,
  Sweepstakes,
  SweepstakesStatus,
  SweepstakesTiming,
  TaskJob
} from '@prisma/client';
import type { TaskOf, TaskType } from '@/lib/task/schemas';
import type { TaskJobWithRelations } from '@giveaway/task-jobs-core/types';

export const TWEET_URL = 'https://x.com/giveawaydog/status/1234567890';
export const BLUESKY_POST_URL =
  'https://bsky.app/profile/giveawaydog.bsky.social/post/3kabc123';

const BASE = {
  title: 'Task title',
  value: 1,
  mandatory: false,
  tasksRequired: 0
};

export const VALID_TASK_CONFIGS: {
  [K in TaskType]: Omit<TaskOf<K>, 'id'>;
} = {
  BONUS_TASK: { ...BASE, type: 'BONUS_TASK' },
  BONUS_TIMED: {
    ...BASE,
    type: 'BONUS_TIMED',
    startDate: null,
    endDate: null
  },
  BONUS_LIMITED: { ...BASE, type: 'BONUS_LIMITED', maxEntrants: 10 },
  BONUS_LOYALTY: { ...BASE, type: 'BONUS_LOYALTY', loyaltyRequired: 2 },
  BONUS_COMPLETE_PROFILE: { ...BASE, type: 'BONUS_COMPLETE_PROFILE' },
  VISIT_URL: {
    ...BASE,
    type: 'VISIT_URL',
    href: 'https://example.com',
    label: 'Visit us'
  },
  ASK_QUESTION: { ...BASE, type: 'ASK_QUESTION', question: 'Why dogs?' },
  SINGLE_CHOICE: {
    ...BASE,
    type: 'SINGLE_CHOICE',
    question: 'Pick one',
    options: ['a', 'b']
  },
  MULTIPLE_CHOICE: {
    ...BASE,
    type: 'MULTIPLE_CHOICE',
    question: 'Pick some',
    options: ['a', 'b']
  },
  SUBMIT_MEDIA: {
    ...BASE,
    type: 'SUBMIT_MEDIA',
    description: 'Upload a picture',
    acceptedTypes: ['IMAGE']
  },
  TWITTER_CONNECT: { ...BASE, type: 'TWITTER_CONNECT' },
  TWITTER_FOLLOW: {
    ...BASE,
    type: 'TWITTER_FOLLOW',
    username: 'https://x.com/giveawaydog'
  },
  TWITTER_RETWEET: { ...BASE, type: 'TWITTER_RETWEET', tweetId: TWEET_URL },
  TWITTER_RETWEET_IMPORT: {
    ...BASE,
    type: 'TWITTER_RETWEET_IMPORT',
    tweetId: TWEET_URL,
    importingAccount: 'integration-1'
  },
  TWITTER_RETWEET_IMPORT_V2: {
    ...BASE,
    type: 'TWITTER_RETWEET_IMPORT_V2',
    tweetId: TWEET_URL
  },
  TWITTER_LIKE: { ...BASE, type: 'TWITTER_LIKE', tweetId: TWEET_URL },
  TWITTER_LIKE_IMPORT: {
    ...BASE,
    type: 'TWITTER_LIKE_IMPORT',
    tweetId: TWEET_URL,
    importingAccount: 'integration-1'
  },
  STEAM_WISHLIST: {
    ...BASE,
    type: 'STEAM_WISHLIST',
    appId: 'https://store.steampowered.com/app/123'
  },
  STEAM_FOLLOW: {
    ...BASE,
    type: 'STEAM_FOLLOW',
    developer: 'https://store.steampowered.com/developer/Valve',
    requireProof: false
  },
  DISCORD_JOIN: {
    ...BASE,
    type: 'DISCORD_JOIN',
    invite: 'https://discord.gg/abc123',
    channel: 'https://discord.com/channels/1/2'
  },
  DISCORD_INTERACTION_IMPORT: {
    ...BASE,
    type: 'DISCORD_INTERACTION_IMPORT',
    link: 'https://discord.com/channels/1/2/3'
  },
  TWITCH_FOLLOW: {
    ...BASE,
    type: 'TWITCH_FOLLOW',
    channel: 'https://www.twitch.tv/giveawaydog'
  },
  TWITCH_CHAT_IMPORT: {
    ...BASE,
    type: 'TWITCH_CHAT_IMPORT',
    importingAccount: 'integration-1',
    channelUrl: 'https://www.twitch.tv/giveawaydog',
    trigger: '!enter'
  },
  KICK_FOLLOW: {
    ...BASE,
    type: 'KICK_FOLLOW',
    channel: 'https://kick.com/giveawaydog'
  },
  SECRET_CODE: {
    ...BASE,
    type: 'SECRET_CODE',
    code: 'WOOF',
    caseSensitive: false
  },
  SECRET_CODE_V2: {
    ...BASE,
    type: 'SECRET_CODE_V2',
    codes: ['WOOF'],
    caseSensitive: false
  },
  YOUTUBE_VISIT: {
    ...BASE,
    type: 'YOUTUBE_VISIT',
    channelUrl: 'https://www.youtube.com/@giveawaydog'
  },
  INSTAGRAM_VISIT: {
    ...BASE,
    type: 'INSTAGRAM_VISIT',
    profileUrl: 'https://www.instagram.com/giveawaydog/'
  },
  INSTAGRAM_LIKE: {
    ...BASE,
    type: 'INSTAGRAM_LIKE',
    postUrl: 'https://www.instagram.com/p/abc123/'
  },
  INSTAGRAM_COMMENT: {
    ...BASE,
    type: 'INSTAGRAM_COMMENT',
    postUrl: 'https://www.instagram.com/p/abc123/'
  },
  FACEBOOK_VISIT_PAGE: {
    ...BASE,
    type: 'FACEBOOK_VISIT_PAGE',
    afterVisit: { type: 'INSTANT' },
    pageUrl: 'https://www.facebook.com/giveawaydog'
  },
  FACEBOOK_VIEW_POST: {
    ...BASE,
    type: 'FACEBOOK_VIEW_POST',
    postUrl: 'https://www.facebook.com/giveawaydog/posts/123'
  },
  TIKTOK_FOLLOW: {
    ...BASE,
    type: 'TIKTOK_FOLLOW',
    profileUrl: 'https://www.tiktok.com/@giveawaydog'
  },
  TIKTOK_LIKE: {
    ...BASE,
    type: 'TIKTOK_LIKE',
    postUrl: 'https://www.tiktok.com/@giveawaydog/video/123'
  },
  BLUESKY_CONNECT: { ...BASE, type: 'BLUESKY_CONNECT' },
  BLUESKY_FOLLOW: {
    ...BASE,
    type: 'BLUESKY_FOLLOW',
    profileUrl: 'giveawaydog.bsky.social'
  },
  BLUESKY_LIKE: { ...BASE, type: 'BLUESKY_LIKE', postUrl: BLUESKY_POST_URL },
  BLUESKY_REPOST: {
    ...BASE,
    type: 'BLUESKY_REPOST',
    postUrl: BLUESKY_POST_URL
  },
  BLUESKY_LIKE_IMPORT: {
    ...BASE,
    type: 'BLUESKY_LIKE_IMPORT',
    postUrl: BLUESKY_POST_URL,
    importingAccount: 'integration-1'
  },
  BLUESKY_REPOST_IMPORT: {
    ...BASE,
    type: 'BLUESKY_REPOST_IMPORT',
    postUrl: BLUESKY_POST_URL,
    importingAccount: 'integration-1'
  },
  VELORA_CONNECT: { ...BASE, type: 'VELORA_CONNECT' },
  VELORA_FOLLOW: {
    ...BASE,
    type: 'VELORA_FOLLOW',
    profileUrl: 'https://velora.tv/giveawaydog'
  },
  REFERRAL_LINK: { ...BASE, type: 'REFERRAL_LINK', maximum: null },
  LINKEDIN_CONNECT: { ...BASE, type: 'LINKEDIN_CONNECT' },
  LINKEDIN_FOLLOW: {
    ...BASE,
    type: 'LINKEDIN_FOLLOW',
    profileUrl: 'https://www.linkedin.com/company/giveaway-dog'
  }
};

export const ALL_TASK_TYPES = Object.keys(VALID_TASK_CONFIGS) as TaskType[];

export const taskConfig = <K extends TaskType>(
  type: K,
  overrides: Partial<Omit<TaskOf<K>, 'id' | 'type'>> = {}
): Omit<TaskOf<K>, 'id'> => ({ ...VALID_TASK_CONFIGS[type], ...overrides });

export const taskOf = <K extends TaskType>(
  type: K,
  id = 'task-1',
  overrides: Partial<Omit<TaskOf<K>, 'id' | 'type'>> = {}
): TaskOf<K> => ({ id, ...taskConfig(type, overrides) }) as TaskOf<K>;

export const toJsonConfig = (config: object): Prisma.JsonValue =>
  config as unknown as Prisma.JsonValue;

export const buildSweepstakes = (
  overrides: Partial<Sweepstakes> = {}
): Sweepstakes => ({
  id: 'sweep-1',
  status: 'ACTIVE' as SweepstakesStatus,
  teamId: 'team-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides
});

export const buildTiming = (
  overrides: Partial<SweepstakesTiming> = {}
): SweepstakesTiming => ({
  id: 'timing-1',
  sweepstakesId: 'sweep-1',
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  endDate: new Date('2026-12-01T00:00:00.000Z'),
  timeZone: 'UTC',
  ...overrides
});

export const buildTaskJob = ({
  type = 'BONUS_TASK',
  config,
  data = null,
  sweepstakes = {},
  timing = buildTiming(),
  job = {}
}: {
  type?: TaskType;
  config?: object;
  data?: Prisma.JsonValue;
  sweepstakes?: Partial<Sweepstakes>;
  timing?: SweepstakesTiming | null;
  job?: Partial<TaskJob>;
} = {}): TaskJobWithRelations => ({
  id: 'job-1',
  taskId: 'task-1',
  data,
  runAt: new Date('2026-10-01T00:00:00.000Z'),
  status: 'IN_PROGRESS',
  createdAt: new Date('2026-09-30T00:00:00.000Z'),
  updatedAt: new Date('2026-09-30T00:00:00.000Z'),
  ...job,
  task: {
    id: 'task-1',
    sweepstakesId: 'sweep-1',
    index: 0,
    config: toJsonConfig(config ?? VALID_TASK_CONFIGS[type]),
    sweepstakes: { ...buildSweepstakes(sweepstakes), timing }
  }
});
