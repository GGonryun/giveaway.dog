import { nanoid } from 'nanoid';
import { TemplateDetailsSchema } from '../schemas/template';
import { toDefaultValues } from '@/lib/task/defaults';
import { Nil } from '@/lib/types';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  TWITTER_POST_URL,
  TWITTER_PROFILE_URL
} from '@/lib/settings';
import {
  DEFAULT_SPONSOR_NAME,
  DEFAULT_WINNER_SELECTION_METHOD,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE
} from '@/schemas/giveaway/defaults';

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
    minQualityScore: 70,
    allowMultipleWins: false
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
    minQualityScore: 70,
    allowMultipleWins: false
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
  TWITTER_TEMPLATE
];

export const getTemplateById = (
  id: Nil<string>
): TemplateDetailsSchema | null => {
  const template = STATIC_TEMPLATES.find((t) => t.id === id);
  return template || null;
};
