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
    ['BONUS_COMPLETE_PROFILE']: {
      id: '',
      type: 'BONUS_COMPLETE_PROFILE',
      title: 'Complete your profile',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['VISIT_URL']: {
      id: '',
      type: 'VISIT_URL',
      title: 'Visit our website',
      label: 'Click Here!',
      href: '',
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
      username: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_RETWEET']: {
      id: '',
      type: 'TWITTER_RETWEET',
      title: 'Repost our sweepstakes',
      tweetId: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_RETWEET_IMPORT']: {
      id: '',
      type: 'TWITTER_RETWEET_IMPORT',
      title: 'Repost our sweepstakes',
      tweetId: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      importingAccount: ''
    },
    ['TWITTER_LIKE']: {
      id: '',
      type: 'TWITTER_LIKE',
      title: 'Like our post',
      tweetId: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITTER_LIKE_IMPORT']: {
      id: '',
      type: 'TWITTER_LIKE_IMPORT',
      title: 'Like our post',
      tweetId: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      importingAccount: ''
    },
    ['STEAM_WISHLIST']: {
      id: '',
      type: 'STEAM_WISHLIST',
      title: 'Add to your Steam Wishlist',
      appId: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['DISCORD_JOIN']: {
      id: '',
      type: 'DISCORD_JOIN',
      title: 'Join our Discord server',
      invite: '',
      channel: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TWITCH_FOLLOW']: {
      id: '',
      type: 'TWITCH_FOLLOW',
      title: 'Follow us on Twitch',
      channel: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['KICK_FOLLOW']: {
      id: '',
      type: 'KICK_FOLLOW',
      title: 'Follow us on Kick',
      channel: '',
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
      caseSensitive: false,
      mandatory: false,
      tasksRequired: 0
    },
    ['YOUTUBE_VISIT']: {
      id: '',
      type: 'YOUTUBE_VISIT',
      title: 'Visit our YouTube channel',
      channelUrl: '',
      channelName: '',
      subConfirmation: false,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['INSTAGRAM_VISIT']: {
      id: '',
      type: 'INSTAGRAM_VISIT',
      title: 'Visit our Instagram profile',
      profileUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['INSTAGRAM_LIKE']: {
      id: '',
      type: 'INSTAGRAM_LIKE',
      title: 'View our Instagram post',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['INSTAGRAM_COMMENT']: {
      id: '',
      type: 'INSTAGRAM_COMMENT',
      title: 'Comment on our Instagram post',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['FACEBOOK_VISIT_PAGE']: {
      id: '',
      type: 'FACEBOOK_VISIT_PAGE',
      title: 'Visit our Facebook page',
      pageUrl: '',
      afterVisit: {
        type: 'INSTANT'
      },
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['FACEBOOK_VIEW_POST']: {
      id: '',
      type: 'FACEBOOK_VIEW_POST',
      title: 'View our Facebook post',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TIKTOK_FOLLOW']: {
      id: '',
      type: 'TIKTOK_FOLLOW',
      title: 'Follow us on TikTok',
      profileUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['TIKTOK_LIKE']: {
      id: '',
      type: 'TIKTOK_LIKE',
      title: 'Like our TikTok post',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['BLUESKY_CONNECT']: {
      id: '',
      type: 'BLUESKY_CONNECT',
      title: 'Connect to Bluesky',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['BLUESKY_FOLLOW']: {
      id: '',
      type: 'BLUESKY_FOLLOW',
      title: 'Follow us on Bluesky',
      profileUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['BLUESKY_LIKE']: {
      id: '',
      type: 'BLUESKY_LIKE',
      title: 'Like our Bluesky post',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['BLUESKY_REPOST']: {
      id: '',
      type: 'BLUESKY_REPOST',
      title: 'Repost on Bluesky',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['BLUESKY_LIKE_IMPORT']: {
      id: '',
      type: 'BLUESKY_LIKE_IMPORT',
      title: 'Like our Bluesky post',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      importingAccount: ''
    },
    ['BLUESKY_REPOST_IMPORT']: {
      id: '',
      type: 'BLUESKY_REPOST_IMPORT',
      title: 'Repost on Bluesky',
      postUrl: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0,
      importingAccount: ''
    },
    ['ASK_QUESTION']: {
      id: '',
      type: 'ASK_QUESTION',
      title: 'Answer a question',
      question: '',
      placeholder: '',
      instructions: '',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['SINGLE_CHOICE']: {
      id: '',
      type: 'SINGLE_CHOICE',
      title: 'Select an option',
      question: '',
      options: ['Option 1', 'Option 2'],
      value: 1,
      mandatory: false,
      tasksRequired: 0
    },
    ['MULTIPLE_CHOICE']: {
      id: '',
      type: 'MULTIPLE_CHOICE',
      title: 'Select one or more options',
      question: '',
      options: ['Option 1', 'Option 2'],
      minSelections: 1,
      maxSelections: undefined,
      value: 1,
      mandatory: false,
      tasksRequired: 0
    }
  };

  return defaults[type];
};
