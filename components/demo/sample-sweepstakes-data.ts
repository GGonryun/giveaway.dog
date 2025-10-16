import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { nanoid } from 'nanoid';

export const SAMPLE_SWEEPSTAKES_DATA: GiveawayFormSchema = {
  setup: {
    name: 'Demo Giveaway - Win Amazing Prizes!',
    description:
      'Enter for a chance to win incredible prizes in our demo giveaway. Complete simple tasks to increase your chances of winning!',
    banner: ''
  },
  timing: {
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      id: nanoid(),
      type: 'VISIT_URL',
      value: 1,
      label: 'Link Label',
      title: 'Visit our website',
      mandatory: false,
      tasksRequired: 0,
      href: 'https://example.com'
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
      color: '#edf0f4'
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
