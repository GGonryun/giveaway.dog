import { TaskOf } from '@/schemas/tasks/schemas';
import { TaskType } from '@prisma/client';

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
      username: 'TheGiveawayDog',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_RETWEET']: {
      id: '',
      type: 'TWITTER_RETWEET',
      title: 'Repost our sweepstakes',
      tweetId: '1948654500698619966',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['STEAM_WISHLIST']: {
      id: '',
      type: 'STEAM_WISHLIST',
      title: 'Add to your Steam Wishlist',
      appId: 'https://store.steampowered.com/app/2457870/Sandys_Great_Escape/',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    }
  };

  return defaults[type];
};
