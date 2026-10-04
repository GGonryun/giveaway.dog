import { nanoid } from 'nanoid';
import { TemplateDetailsSchema } from '../schemas/template';
import { toDefaultValues } from '@giveaway/task-model/defaults';
import { Nil } from '@giveaway/util-types/types';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  TWITTER_POST_URL,
  TWITTER_PROFILE_URL
} from '@giveaway/app-config/settings';
import {
  DEFAULT_SPONSOR_NAME,
  DEFAULT_WINNER_SELECTION_METHOD,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_ALLOW_USER_SELECTION,
  DEFAULT_ALLOW_MULTIPLE_WINS
} from '@/schemas/giveaway/defaults';
import { IdentityProvider } from '@prisma/client';

const BASIC_TEMPLATE: TemplateDetailsSchema = {
  id: 'basic-giveaway',
  template: {
    name: 'Basic Giveaway',
    description: 'A simple giveaway template with essential tasks',
    image:
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/73f5c6fa-953d-4a1d-a4b6-3cd03cddb4a7.png'
  },
  setup: {
    name: 'My Giveaway',
    description: 'Enter to win amazing prizes!',
    banner:
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/73f5c6fa-953d-4a1d-a4b6-3cd03cddb4a7.png'
  },
  visibility: {
    visibility: 'UNLISTED',
    slug: null
  },
  tasks: [
    {
      ...toDefaultValues('VISIT_URL'),
      href: 'https://giveaway.dog',
      id: nanoid()
    }
  ],
  audience: {
    formFields: [],
    requirePreEntryLogin: false,
    allowedIdentities: DEFAULT_ALLOWED_IDENTITIES
  },
  design: {
    displayName: true,
    displayDescription: true,
    aspectRatio: 'VIDEO',
    background: {
      type: 'color',
      color: '#edf0f4'
    }
  },
  criteria: {
    minTasksCompleted: 1,
    minQualityScore: 50,
    allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
    allowUserSelection: DEFAULT_ALLOW_USER_SELECTION
  },
  terms: {
    type: 'TEMPLATE',
    sponsorAddress: '',
    sponsorName: DEFAULT_SPONSOR_NAME,
    winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
    notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
    claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
    governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
    privacyPolicyUrl: ''
  },
  prizes: []
};

const TWITTER_TEMPLATE: TemplateDetailsSchema = {
  id: 'x-giveaway',
  template: {
    name: 'X Engagement',
    description: 'Encourage participants to engage on social media (X)',
    image:
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/aef1ff49-0e3b-4954-8a6b-16036cbc798b.png'
  },
  setup: {
    name: 'X Giveaway',
    description: 'Win prizes by engaging with us on X!',
    banner:
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/aef1ff49-0e3b-4954-8a6b-16036cbc798b.png'
  },
  visibility: {
    visibility: 'UNLISTED',
    slug: null
  },
  tasks: [
    { ...toDefaultValues('TWITTER_CONNECT'), mandatory: true, id: nanoid() },
    {
      ...toDefaultValues('TWITTER_FOLLOW'),
      username: TWITTER_PROFILE_URL,
      id: nanoid()
    },
    {
      ...toDefaultValues('TWITTER_RETWEET'),
      tweetId: TWITTER_POST_URL,
      id: nanoid()
    },
    {
      ...toDefaultValues('BONUS_TASK'),
      tasksRequired: 3,
      id: nanoid()
    }
  ],
  audience: {
    formFields: [],
    requirePreEntryLogin: false,
    allowedIdentities: DEFAULT_ALLOWED_IDENTITIES
  },
  design: {
    displayName: true,
    displayDescription: true,
    aspectRatio: 'VIDEO',
    background: {
      type: 'color',
      color: '#000000'
    }
  },
  criteria: {
    minTasksCompleted: 1,
    minQualityScore: 50,
    allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
    allowUserSelection: DEFAULT_ALLOW_USER_SELECTION
  },
  terms: {
    type: 'TEMPLATE',
    sponsorAddress: '',
    sponsorName: DEFAULT_SPONSOR_NAME,
    winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
    notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
    claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
    governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
    privacyPolicyUrl: ''
  },
  prizes: []
};

const ANONYMOUS_UPLOAD_TEMPLATE: TemplateDetailsSchema = {
  id: 'anonymous-sweepstakes',
  template: {
    name: 'Anonymous Sweepstakes',
    description:
      'Allow anonymous entries to engage on social media (X) without having to make an account on GiveawayDog',
    image:
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/question-marks.jpg'
  },
  setup: {
    name: 'Anonymous X Giveaway',
    description: 'Win prizes by engaging with us on X! No account needed',
    banner:
      'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/question-marks.jpg'
  },
  visibility: {
    visibility: 'UNLISTED',
    slug: null
  },
  tasks: [
    {
      ...toDefaultValues('SUBMIT_MEDIA'),
      title: 'Follow us on X',
      description:
        '<p>Follow <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-primary underline hover:text-primary/80\" href=\"https://x.com/TheGiveawayDog\">@TheGiveawayDog</a> on X and post proof</p>',
      value: 1,
      id: nanoid()
    },
    {
      ...toDefaultValues('SUBMIT_MEDIA'),
      title: 'Share our post',
      description:
        '<p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-primary underline hover:text-primary/80\" href=\"https://x.com/TheGiveawayDog/status/1948654500698619966\">Repost our post on X</a> and upload proof</p>',
      value: 1,
      id: nanoid()
    },
    {
      ...toDefaultValues('SUBMIT_MEDIA'),
      title: 'Like our post',
      description:
        '<p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-primary underline hover:text-primary/80\" href=\"https://x.com/TheGiveawayDog/status/1948654500698619966\">Like our post on X</a> and upload proof</p>',
      value: 1,
      id: nanoid()
    }
  ],
  audience: {
    formFields: [],
    requirePreEntryLogin: true,
    allowedIdentities: [IdentityProvider.ANONYMOUS]
  },
  design: {
    displayName: true,
    displayDescription: true,
    aspectRatio: 'VIDEO',
    background: {
      type: 'color',
      color: '#dddddd'
    }
  },
  criteria: {
    minTasksCompleted: 1,
    minQualityScore: 50,
    allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS,
    allowUserSelection: DEFAULT_ALLOW_USER_SELECTION
  },
  terms: {
    type: 'TEMPLATE',
    sponsorAddress: '',
    sponsorName: DEFAULT_SPONSOR_NAME,
    winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
    notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
    claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
    governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
    privacyPolicyUrl: ''
  },
  prizes: []
};

export const STATIC_TEMPLATES: TemplateDetailsSchema[] = [
  BASIC_TEMPLATE,
  TWITTER_TEMPLATE,
  ANONYMOUS_UPLOAD_TEMPLATE
];

export const getTemplateById = (
  id: Nil<string>
): TemplateDetailsSchema | null => {
  const template = STATIC_TEMPLATES.find((t) => t.id === id);
  return template || null;
};
