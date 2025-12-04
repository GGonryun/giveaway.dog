import {
  DEFAULT_YOUTUBE_VISIT_TITLE,
  DISCORD_INVITE_LINK,
  DISCORD_PUBLIC_CHANNEL_URL,
  KICK_CHANNEL_URL,
  STEAM_APP_ID_URL,
  TWITCH_CHANNEL_URL,
  TWITTER_POST_URL,
  TWITTER_PROFILE_URL,
  YOUTUBE_CHANNEL_URL
} from '@/lib/settings';
import { TaskType } from '@prisma/client';
import { TaskOf } from './schemas';

export const toDefaultValues = <T extends TaskType>(type: T): TaskOf<T> => {
  const defaults: { [key in TaskType]: TaskOf<key> } = {
    ['BONUS_TASK']: {
      id: '',
      type: 'BONUS_TASK',
      title: 'Click for a bonus entry',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['BONUS_TIMED']: {
      id: '',
      type: 'BONUS_TIMED',
      title: 'Click for a bonus entry',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['BONUS_LIMITED']: {
      id: '',
      type: 'BONUS_LIMITED',
      title: 'Click for a bonus entry',
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      maxEntrants: 100
    },
    ['BONUS_LOYALTY']: {
      id: '',
      type: 'BONUS_LOYALTY',
      title: 'Click for a bonus entry',
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      loyaltyRequired: 3
    },
    ['VISIT_URL']: {
      id: '',
      type: 'VISIT_URL',
      title: 'Visit our website',
      label: 'Click Here!',
      href: 'https://example.com',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_CONNECT']: {
      id: '',
      type: 'TWITTER_CONNECT',
      title: 'Connect to X (Twitter)',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_FOLLOW']: {
      id: '',
      type: 'TWITTER_FOLLOW',
      title: 'Follow us on X (Twitter)',
      username: TWITTER_PROFILE_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_RETWEET']: {
      id: '',
      type: 'TWITTER_RETWEET',
      title: 'Repost our sweepstakes',
      tweetId: TWITTER_POST_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_RETWEET_IMPORT']: {
      id: '',
      type: 'TWITTER_RETWEET_IMPORT',
      title: 'Repost our sweepstakes',
      tweetId: TWITTER_POST_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      importingAccount: ''
    },
    ['TWITTER_LIKE']: {
      id: '',
      type: 'TWITTER_LIKE',
      title: 'Like our post',
      tweetId: TWITTER_POST_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_LIKE_IMPORT']: {
      id: '',
      type: 'TWITTER_LIKE_IMPORT',
      title: 'Like our post',
      tweetId: TWITTER_POST_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      importingAccount: ''
    },
    ['STEAM_WISHLIST']: {
      id: '',
      type: 'STEAM_WISHLIST',
      title: 'Add to your Steam Wishlist',
      appId: STEAM_APP_ID_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['DISCORD_JOIN']: {
      id: '',
      type: 'DISCORD_JOIN',
      title: 'Join our Discord server',
      invite: DISCORD_INVITE_LINK,
      channel: DISCORD_PUBLIC_CHANNEL_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITCH_FOLLOW']: {
      id: '',
      type: 'TWITCH_FOLLOW',
      title: 'Follow us on Twitch',
      channel: TWITCH_CHANNEL_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['KICK_FOLLOW']: {
      id: '',
      type: 'KICK_FOLLOW',
      title: 'Follow us on Kick',
      channel: KICK_CHANNEL_URL,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['SECRET_CODE']: {
      id: '',
      type: 'SECRET_CODE',
      title: 'Enter the secret code',
      code: 'MY_SECRET_CODE',
      hint: 'Check our announcement channel for the code!',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['YOUTUBE_VISIT']: {
      id: '',
      type: 'YOUTUBE_VISIT',
      title: DEFAULT_YOUTUBE_VISIT_TITLE,
      channelUrl: YOUTUBE_CHANNEL_URL,
      channelName: 'GiveawayDog',
      subConfirmation: false,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    }
  };

  return defaults[type];
};
