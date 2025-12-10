import { nanoid } from 'nanoid';
import { StaticTemplate } from '../schemas/template';
import { toDefaultValues } from '@/lib/task/defaults';
import { Nil } from '@/lib/types';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  TWITTER_POST_URL,
  TWITTER_PROFILE_URL
} from '@/lib/settings';

const BASIC_TEMPLATE: StaticTemplate = {
  id: 'basic-giveaway',
  name: 'Basic Giveaway',
  description: 'A simple giveaway template with essential tasks',
  image:
    'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/73f5c6fa-953d-4a1d-a4b6-3cd03cddb4a7.png',
  tags: ['Tech', 'Gaming'],
  content: {
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
      requireEmail: true,
      requirePreEntryLogin: false,
      minimumAgeRestriction: {
        value: 18,
        label: 'You must be 18 years or older to participate',
        required: true,
        format: 'CHECKBOX'
      },
      allowedIdentities: DEFAULT_ALLOWED_IDENTITIES
    },
    design: {
      displayName: true,
      displayDescription: true,
      background: {
        type: 'color',
        color: '#edf0f4'
      }
    },
    criteria: {
      minTasksCompleted: 1,
      minQualityScore: 70,
      allowMultipleWins: false
    }
  }
};

const TWITTER_TEMPLATE: StaticTemplate = {
  id: 'x-giveaway',
  name: 'X Engagement',
  description: 'Encourage participants to engage on social media (X)',
  image:
    'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/aef1ff49-0e3b-4954-8a6b-16036cbc798b.png',
  tags: ['Social Media', 'Marketing'],
  content: {
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
      requireEmail: true,
      requirePreEntryLogin: false,
      minimumAgeRestriction: {
        value: 18,
        label: 'You must be 18 years or older to participate',
        required: true,
        format: 'CHECKBOX'
      },
      allowedIdentities: DEFAULT_ALLOWED_IDENTITIES
    },
    design: {
      displayName: true,
      displayDescription: true,
      background: {
        type: 'color',
        color: '#000000'
      }
    },
    criteria: {
      minTasksCompleted: 1,
      minQualityScore: 70,
      allowMultipleWins: false
    }
  }
};

export const STATIC_TEMPLATES: StaticTemplate[] = [
  BASIC_TEMPLATE,
  TWITTER_TEMPLATE
];

export const getTemplateById = (id: Nil<string>): StaticTemplate | null => {
  const template = STATIC_TEMPLATES.find((t) => t.id === id);
  return template || null;
};
