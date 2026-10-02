import type { Task } from '@prisma/client';
import type { TaskOf, TaskType } from '../schemas';

const base = {
  title: 'Sample task',
  value: 2,
  mandatory: false,
  tasksRequired: 0
};

export const TWEET_URL = 'https://x.com/giveawaydog/status/1234567890';
export const BLUESKY_POST_URL =
  'https://bsky.app/profile/giveawaydog.bsky.social/post/3kabc123';
export const INSTAGRAM_POST_URL = 'https://www.instagram.com/p/ABC123/';

export const VALID_TASKS: { [K in TaskType]: TaskOf<K> } = {
  BONUS_TASK: { ...base, id: 't-bonus', type: 'BONUS_TASK' },
  BONUS_TIMED: {
    ...base,
    id: 't-timed',
    type: 'BONUS_TIMED',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-02-01T00:00:00.000Z'
  },
  BONUS_LIMITED: {
    ...base,
    id: 't-limited',
    type: 'BONUS_LIMITED',
    maxEntrants: 10
  },
  BONUS_LOYALTY: {
    ...base,
    id: 't-loyalty',
    type: 'BONUS_LOYALTY',
    loyaltyRequired: 2
  },
  BONUS_COMPLETE_PROFILE: {
    ...base,
    id: 't-profile',
    type: 'BONUS_COMPLETE_PROFILE'
  },
  VISIT_URL: {
    ...base,
    id: 't-visit',
    type: 'VISIT_URL',
    href: 'https://example.com/landing',
    label: 'Visit us'
  },
  ASK_QUESTION: {
    ...base,
    id: 't-ask',
    type: 'ASK_QUESTION',
    question: 'What is your favorite dog?'
  },
  SINGLE_CHOICE: {
    ...base,
    id: 't-single',
    type: 'SINGLE_CHOICE',
    question: 'Pick one',
    options: ['Red', 'Blue']
  },
  MULTIPLE_CHOICE: {
    ...base,
    id: 't-multiple',
    type: 'MULTIPLE_CHOICE',
    question: 'Pick some',
    options: ['Red', 'Blue', 'Green']
  },
  SUBMIT_MEDIA: {
    ...base,
    id: 't-media',
    type: 'SUBMIT_MEDIA',
    description: 'Upload a screenshot',
    acceptedTypes: ['IMAGE']
  },
  TWITTER_CONNECT: { ...base, id: 't-x-connect', type: 'TWITTER_CONNECT' },
  TWITTER_FOLLOW: {
    ...base,
    id: 't-x-follow',
    type: 'TWITTER_FOLLOW',
    username: 'https://x.com/giveawaydog'
  },
  TWITTER_RETWEET: {
    ...base,
    id: 't-x-retweet',
    type: 'TWITTER_RETWEET',
    tweetId: TWEET_URL
  },
  TWITTER_RETWEET_IMPORT: {
    ...base,
    id: 't-x-retweet-import',
    type: 'TWITTER_RETWEET_IMPORT',
    tweetId: TWEET_URL,
    importingAccount: 'account-1'
  },
  TWITTER_RETWEET_IMPORT_V2: {
    ...base,
    id: 't-x-retweet-v2',
    type: 'TWITTER_RETWEET_IMPORT_V2',
    tweetId: TWEET_URL
  },
  TWITTER_LIKE: {
    ...base,
    id: 't-x-like',
    type: 'TWITTER_LIKE',
    tweetId: TWEET_URL
  },
  TWITTER_LIKE_IMPORT: {
    ...base,
    id: 't-x-like-import',
    type: 'TWITTER_LIKE_IMPORT',
    tweetId: TWEET_URL,
    importingAccount: 'account-1'
  },
  STEAM_WISHLIST: {
    ...base,
    id: 't-steam-wishlist',
    type: 'STEAM_WISHLIST',
    appId: 'https://store.steampowered.com/app/123456/My_Game'
  },
  STEAM_FOLLOW: {
    ...base,
    id: 't-steam-follow',
    type: 'STEAM_FOLLOW',
    developer: 'https://store.steampowered.com/developer/Valve',
    requireProof: false
  },
  DISCORD_JOIN: {
    ...base,
    id: 't-discord-join',
    type: 'DISCORD_JOIN',
    invite: 'https://discord.gg/abc123',
    channel: 'https://discord.com/channels/111/222'
  },
  DISCORD_INTERACTION_IMPORT: {
    ...base,
    id: 't-discord-import',
    type: 'DISCORD_INTERACTION_IMPORT',
    link: 'https://discord.com/channels/111/222/333'
  },
  TWITCH_FOLLOW: {
    ...base,
    id: 't-twitch-follow',
    type: 'TWITCH_FOLLOW',
    channel: 'https://www.twitch.tv/giveawaydog'
  },
  TWITCH_CHAT_IMPORT: {
    ...base,
    id: 't-twitch-chat',
    type: 'TWITCH_CHAT_IMPORT',
    importingAccount: 'account-1',
    channelUrl: 'https://www.twitch.tv/giveawaydog',
    trigger: '!giveaway'
  },
  KICK_FOLLOW: {
    ...base,
    id: 't-kick',
    type: 'KICK_FOLLOW',
    channel: 'https://kick.com/giveawaydog'
  },
  SECRET_CODE: {
    ...base,
    id: 't-secret',
    type: 'SECRET_CODE',
    code: 'WOOF',
    caseSensitive: false
  },
  SECRET_CODE_V2: {
    ...base,
    id: 't-secret-v2',
    type: 'SECRET_CODE_V2',
    codes: ['WOOF', 'BARK'],
    caseSensitive: true
  },
  YOUTUBE_VISIT: {
    ...base,
    id: 't-youtube',
    type: 'YOUTUBE_VISIT',
    channelUrl: 'https://www.youtube.com/@giveawaydog'
  },
  INSTAGRAM_VISIT: {
    ...base,
    id: 't-ig-visit',
    type: 'INSTAGRAM_VISIT',
    profileUrl: 'https://www.instagram.com/giveawaydog/'
  },
  INSTAGRAM_LIKE: {
    ...base,
    id: 't-ig-like',
    type: 'INSTAGRAM_LIKE',
    postUrl: INSTAGRAM_POST_URL
  },
  INSTAGRAM_COMMENT: {
    ...base,
    id: 't-ig-comment',
    type: 'INSTAGRAM_COMMENT',
    postUrl: INSTAGRAM_POST_URL
  },
  FACEBOOK_VISIT_PAGE: {
    ...base,
    id: 't-fb-page',
    type: 'FACEBOOK_VISIT_PAGE',
    afterVisit: { type: 'INSTANT' },
    pageUrl: 'https://www.facebook.com/giveawaydog'
  },
  FACEBOOK_VIEW_POST: {
    ...base,
    id: 't-fb-post',
    type: 'FACEBOOK_VIEW_POST',
    postUrl: 'https://www.facebook.com/giveawaydog/posts/123456789'
  },
  TIKTOK_FOLLOW: {
    ...base,
    id: 't-tiktok-follow',
    type: 'TIKTOK_FOLLOW',
    profileUrl: 'https://www.tiktok.com/@giveawaydog'
  },
  TIKTOK_LIKE: {
    ...base,
    id: 't-tiktok-like',
    type: 'TIKTOK_LIKE',
    postUrl: 'https://www.tiktok.com/@giveawaydog/video/1234567890'
  },
  BLUESKY_CONNECT: { ...base, id: 't-bsky-connect', type: 'BLUESKY_CONNECT' },
  BLUESKY_FOLLOW: {
    ...base,
    id: 't-bsky-follow',
    type: 'BLUESKY_FOLLOW',
    profileUrl: 'giveawaydog.bsky.social'
  },
  BLUESKY_LIKE: {
    ...base,
    id: 't-bsky-like',
    type: 'BLUESKY_LIKE',
    postUrl: BLUESKY_POST_URL
  },
  BLUESKY_REPOST: {
    ...base,
    id: 't-bsky-repost',
    type: 'BLUESKY_REPOST',
    postUrl: BLUESKY_POST_URL
  },
  BLUESKY_LIKE_IMPORT: {
    ...base,
    id: 't-bsky-like-import',
    type: 'BLUESKY_LIKE_IMPORT',
    postUrl: BLUESKY_POST_URL,
    importingAccount: 'account-1'
  },
  BLUESKY_REPOST_IMPORT: {
    ...base,
    id: 't-bsky-repost-import',
    type: 'BLUESKY_REPOST_IMPORT',
    postUrl: BLUESKY_POST_URL,
    importingAccount: 'account-1'
  },
  VELORA_CONNECT: { ...base, id: 't-velora-connect', type: 'VELORA_CONNECT' },
  VELORA_FOLLOW: {
    ...base,
    id: 't-velora-follow',
    type: 'VELORA_FOLLOW',
    profileUrl: 'https://velora.tv/giveawaydog'
  },
  REFERRAL_LINK: {
    ...base,
    id: 't-referral',
    type: 'REFERRAL_LINK',
    maximum: 5
  },
  LINKEDIN_CONNECT: {
    ...base,
    id: 't-linkedin-connect',
    type: 'LINKEDIN_CONNECT'
  },
  LINKEDIN_FOLLOW: {
    ...base,
    id: 't-linkedin-follow',
    type: 'LINKEDIN_FOLLOW',
    profileUrl: 'https://www.linkedin.com/company/giveaway-dog'
  }
};

export const TASK_TYPES = Object.keys(VALID_TASKS) as TaskType[];

export const storedTask = (
  config: unknown,
  overrides: Partial<Omit<Task, 'config'>> = {}
): Task => ({
  id: 'task-1',
  sweepstakesId: 'sweep-1',
  index: 0,
  config: config as Task['config'],
  ...overrides
});

export const toStoredConfig = (task: TaskOf<TaskType>): Task['config'] =>
  JSON.parse(JSON.stringify(task));
