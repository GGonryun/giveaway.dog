'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { TemplateFormSchema } from '@giveaway/templates-model/schemas/template';
import { SweepstakesSharedFormPreview } from '@giveaway/sweepstakes-editor-preview/sweepstakes-editor-preview';
import { GiveawayFormSchema } from '@giveaway/sweepstakes-model/schemas';
import {
  DEFAULT_MIN_QUALITY_SCORE,
  DEFAULT_MIN_TASK_COMPLETED,
  DEFAULT_ALLOW_MULTIPLE_WINS,
  DEFAULT_WINNER_SELECTION_METHOD,
  DEFAULT_NOTIFICATION_TIMEFRAME_DAYS,
  DEFAULT_CLAIM_DEADLINE_DAYS,
  DEFAULT_GOVERNING_LAW_COUNTRY_CODE,
  DEFAULT_SPONSOR_NAME
} from '@giveaway/sweepstakes-model/defaults';
import { VisibilityType } from '@giveaway/db-model';
import { add } from 'date-fns/add';
import { startOfDay } from 'date-fns/startOfDay';
import { timezone } from '@giveaway/util-time/time';
import { DeepPartial } from '@giveaway/util-types/types';

export const TemplatePreview: React.FC = () => {
  const form = useFormContext<TemplateFormSchema>();

  // Watch template content
  const formValues = useWatch({
    control: form.control
  });

  // Convert template to full sweepstakes format for preview
  const sweepstakesData: DeepPartial<GiveawayFormSchema> = {
    setup: formValues?.setup ?? { name: '', description: '', banner: '' },
    audience: formValues?.audience ?? {
      allowedIdentities: [],
      requirePreEntryLogin: false,
      formFields: [],
      regionalRestriction: null
    },
    tasks: formValues?.tasks ?? [],
    design: formValues?.design ?? {
      displayName: true,
      displayDescription: true,
      aspectRatio: 'VIDEO',
      background: { type: 'color', color: '#edf0f4' }
    },
    criteria: formValues?.criteria ?? {
      minQualityScore: DEFAULT_MIN_QUALITY_SCORE,
      minTasksCompleted: DEFAULT_MIN_TASK_COMPLETED,
      allowMultipleWins: DEFAULT_ALLOW_MULTIPLE_WINS
    },
    // Fill in excluded fields with defaults (timing, terms, prizes, visibility)
    timing: {
      startDate: startOfDay(add(Date.now(), { days: 1 })),
      endDate: startOfDay(add(Date.now(), { days: 1, weeks: 1 })),
      timeZone: timezone.current()
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
    prizes: [],
    visibility: {
      visibility: VisibilityType.UNLISTED,
      slug: null
    }
  };

  return <SweepstakesSharedFormPreview formValues={sweepstakesData} />;
};
