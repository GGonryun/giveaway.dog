import {
  DISCORD_INVITE_LINK,
  DISCORD_PUBLIC_CHANNEL_URL,
  STEAM_APP_ID_URL,
  TWITCH_CHANNEL_URL,
  TWITTER_POST_URL,
  TWITTER_PROFILE_URL
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
    }
  };

  return defaults[type];
};
