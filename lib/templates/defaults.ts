import { nanoid } from 'nanoid';
import { DEFAULT_MINIMUM_AGE_FIELD } from '../custom-fields/defaults';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  DEFAULT_REQUIRED_PRE_ENTRY_LOGIN
} from '../settings';
import { TemplateFormSchema } from './schemas/template';
import {
  DEFAULT_SWEEPSTAKES_NAME,
  DEFAULT_SWEEPSTAKES_DESCRIPTION,
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED,
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_WINNER_SELECTION_METHOD,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_DESIGN_DATA
} from '@/schemas/giveaway/defaults';
import { SweepstakesTermsType } from '@prisma/client';

export const DEFAULT_TEMPLATE_NAME = 'My Custom Template';
export const DEFAULT_TEMPLATE_DESCRIPTION = 'A template I created';
export const DEFAULT_TEMPLATE_IMAGE =
  'https://a8mwfsrzadqc10xo.public.blob.vercel-storage.com/placeholder.png';

export const DEFAULT_TEMPLATE_CONTENT = ({
  sponsorName
}: {
  sponsorName: string;
}): TemplateFormSchema => ({
  template: {
    name: DEFAULT_TEMPLATE_NAME,
    description: DEFAULT_TEMPLATE_DESCRIPTION,
    image: DEFAULT_TEMPLATE_IMAGE
  },
  setup: {
    name: DEFAULT_SWEEPSTAKES_NAME,
    description: DEFAULT_SWEEPSTAKES_DESCRIPTION,
    banner: ''
  },
  visibility: {
    visibility: 'UNLISTED',
    slug: null
  },
  audience: {
    requirePreEntryLogin: DEFAULT_REQUIRED_PRE_ENTRY_LOGIN,
    allowedIdentities: DEFAULT_ALLOWED_IDENTITIES,
    formFields: [
      {
        id: nanoid(),
        type: 'USERNAME',
        label: 'Username',
        required: true
      },
      {
        id: nanoid(),
        label: 'Email',
        type: 'EMAIL'
      },
      {
        id: nanoid(),
        ...DEFAULT_MINIMUM_AGE_FIELD
      }
    ]
  },
  prizes: [],
  tasks: [],
  design: DEFAULT_DESIGN_DATA,
  criteria: {
    minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
    minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
    allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS
  },
  terms: {
    type: SweepstakesTermsType.TEMPLATE,
    sponsorAddress: '',
    sponsorName,
    winnerSelectionMethod: DEFAULT_WINNER_SELECTION_METHOD,
    notificationTimeframeDays: DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
    claimDeadlineDays: DEFAULT_CLAIM_DEADLINE_DAYS,
    governingLawCountry: DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
    privacyPolicyUrl: ''
  }
});
