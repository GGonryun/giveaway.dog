import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { nanoid } from 'nanoid';
import { toDefaultValues } from '@/lib/task/defaults';
import { datetime } from '@/lib/date';
import {
  BLUESKY_PROFILE_URL,
  DEFAULT_ALLOWED_IDENTITIES,
  DISCORD_INVITE_LINK,
  DISCORD_PUBLIC_CHANNEL_URL,
  FACEBOOK_POST_URL,
  INSTAGRAM_PROFILE_URL,
  KICK_CHANNEL_URL,
  STEAM_APP_ID_URL,
  TIKTOK_PROFILE_URL,
  TWITCH_CHANNEL_URL,
  TWITTER_PROFILE_URL,
  YOUTUBE_CHANNEL_NAME,
  YOUTUBE_CHANNEL_URL
} from '@/lib/settings';
import { timezone } from '@/lib/time';
import {
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_ALLOW_USER_SELECTION,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED
} from '@/schemas/giveaway/defaults';

export const SAMPLE_SWEEPSTAKES_DATA: GiveawayFormSchema = {
  setup: {
    name: 'Win Amazing Prizes!',
    description:
      'Enter for a chance to win incredible prizes in our demo giveaway. Complete simple tasks to increase your chances of winning!<br/><br/>This is a demo sweepstakes to showcase our platform features.',
    banner: '/images/demo-sweepstakes-banner-2.jpg'
  },
  timing: {
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 128 * 24 * 60 * 60 * 1000),
    timeZone: timezone.current()
  },
  prizes: [
    {
      id: nanoid(),
      name: 'Grand Prize - $500 Gift Card',
      quota: 1
    },
    {
      id: nanoid(),
      name: 'Runner Up - $100 Gift Card',
      quota: 3
    }
  ],
  tasks: [
    {
      ...toDefaultValues('TWITCH_FOLLOW'),
      channel: TWITCH_CHANNEL_URL,
      id: '50ee'
    },
    {
      ...toDefaultValues('BLUESKY_FOLLOW'),
      profileUrl: BLUESKY_PROFILE_URL,
      id: '6d7f'
    },
    {
      ...toDefaultValues('TWITTER_FOLLOW'),
      username: TWITTER_PROFILE_URL,
      id: '4cd9'
    },
    {
      ...toDefaultValues('YOUTUBE_VISIT'),
      subConfirmation: true,
      title: `Visit ${YOUTUBE_CHANNEL_NAME} on YouTube`,
      channelUrl: YOUTUBE_CHANNEL_URL,
      channelName: YOUTUBE_CHANNEL_NAME,
      id: 'a13f'
    },
    {
      ...toDefaultValues('FACEBOOK_VIEW_POST'),
      postUrl: FACEBOOK_POST_URL,
      id: 'b2c4'
    },
    {
      ...toDefaultValues('TIKTOK_FOLLOW'),
      profileUrl: TIKTOK_PROFILE_URL,
      id: 'd7e9'
    },
    {
      ...toDefaultValues('INSTAGRAM_VISIT'),
      profileUrl: INSTAGRAM_PROFILE_URL,
      id: '5fa0'
    },
    {
      ...toDefaultValues('STEAM_WISHLIST'),
      appId: STEAM_APP_ID_URL,
      id: 'f105'
    },
    {
      ...toDefaultValues('DISCORD_JOIN'),
      invite: DISCORD_INVITE_LINK,
      channel: DISCORD_PUBLIC_CHANNEL_URL,
      id: '492b'
    },
    {
      ...toDefaultValues('KICK_FOLLOW'),
      channel: KICK_CHANNEL_URL,
      id: 'bd33'
    }
    // {
    //   ...toDefaultValues('SECRET_CODE'),
    //   hint: 'Use code "DEMO2025" to enter the sweepstakes!',
    //   code: 'DEMO2025',
    //   id: 'ef5b'
    // },
    // {
    //   ...toDefaultValues('BONUS_TIMED'),
    //   title: "Unlock before it's too late",
    //   endDate: datetime.daysFromNow(30).toISOString(),
    //   id: '6b3c'
    // },
    // {
    //   ...toDefaultValues('BONUS_LIMITED'),
    //   title: 'Bonus for the first 100 participants',
    //   maxEntrants: 100,
    //   id: '90e0'
    // },
    // {
    //   ...toDefaultValues('BONUS_LOYALTY'),
    //   id: '4f8e',
    //   title: 'Get rewarded for your loyalty',
    //   loyaltyRequired: 10
    // },
    // {
    //   ...toDefaultValues('REFERRAL_LINK'),
    //   maximum: 5,
    //   id: 'f0la'
    // }
  ],
  terms: {
    type: 'TEMPLATE',
    sponsorName: 'Demo Company',
    sponsorAddress: '123 Demo Street, Demo City, DC 12345',
    winnerSelectionMethod: 'Random Drawing',
    notificationTimeframeDays: 7,
    claimDeadlineDays: 30,
    governingLawCountry: 'US',
    privacyPolicyUrl: 'https://example.com/privacy'
  },
  audience: {
    formFields: [],
    requirePreEntryLogin: false,
    regionalRestriction: undefined,
    allowedIdentities: DEFAULT_ALLOWED_IDENTITIES
  },
  design: {
    displayName: false,
    displayDescription: false,
    aspectRatio: 'VIDEO',
    background: {
      type: 'color',
      color: '#63478b'
    }
  },
  visibility: {
    visibility: 'PUBLIC',
    slug: 'demo-giveaway'
  },
  criteria: {
    minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
    minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
    allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
    allowUserSelection: DEFAULT_ALLOW_USER_SELECTION
  }
};
