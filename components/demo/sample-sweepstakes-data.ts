import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { nanoid } from 'nanoid';
import { toDefaultValues } from '@/lib/task/defaults';
import { datetime } from '@/lib/date';

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
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
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
      id: '1'
    },
    {
      ...toDefaultValues('TWITTER_FOLLOW'),
      id: '2'
    },
    {
      ...toDefaultValues('YOUTUBE_VISIT'),
      subConfirmation: true,
      id: '3'
    },
    {
      ...toDefaultValues('STEAM_WISHLIST'),
      id: '4'
    },
    {
      ...toDefaultValues('DISCORD_JOIN'),
      id: '5'
    },
    {
      ...toDefaultValues('KICK_FOLLOW'),
      id: '6'
    },
    {
      ...toDefaultValues('VISIT_URL'),
      href: 'https://charity.games',
      id: '7'
    },
    {
      ...toDefaultValues('SECRET_CODE'),
      hint: 'Use code "DEMO2025" to enter the sweepstakes!',
      code: 'DEMO2025',
      id: '8'
    },
    {
      ...toDefaultValues('BONUS_TASK'),
      tasksRequired: 3,
      id: '9'
    },
    {
      ...toDefaultValues('BONUS_TIMED'),
      title: "Unlock before it's too late",
      endDate: datetime.daysFromNow(30).toISOString(),
      id: '10'
    },
    {
      ...toDefaultValues('BONUS_LIMITED'),
      title: 'Bonus for the first 100 participants',
      maxEntrants: 100,
      id: '11'
    },
    {
      ...toDefaultValues('TWITTER_RETWEET'),
      id: '12'
    },
    {
      ...toDefaultValues('TWITTER_LIKE'),
      id: '13'
    }
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
    requireEmail: true,
    regionalRestriction: undefined,
    minimumAgeRestriction: {
      value: 18,
      label: 'You must be 18 years or older to participate',
      required: true,
      format: 'CHECKBOX'
    }
  },
  design: {
    displayName: true,
    displayDescription: true,
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
    minTasksCompleted: 1,
    minQualityScore: 70,
    allowMultipleWins: false
  }
};
