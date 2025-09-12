'use client';

import React, { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { GiveawayParticipationSkeleton } from '@/components/sweepstakes/fallbacks/giveaway-skeleton';
import { IncompleteGiveawaySetup } from '@/components/sweepstakes/fallbacks/empty-states';

import {
  GiveawayParticipationSchema,
  GiveawayFormSchema,
  GiveawayWinnerSchema,
  Prize,
  UserParticipationSchema
} from '@/schemas/giveaway/schemas';
import { usePreviewState } from './contexts/preview-state-context';
import {
  MinimumAgeRestrictionFormat,
  RegionalRestrictionFilter,
  SweepstakesTermsType
} from '@prisma/client';
import { defaultTermInputOptions } from './form/terms';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/schemas/giveaway/defaults';
import { noop } from 'lodash';
import { UserProfileSchema } from '@/schemas/user';
import { TaskSchema } from '@/schemas/tasks/schemas';

const mockHost = {
  id: 'preview-host-id',
  slug: 'preview-host',
  name: 'Preview Host',
  avatar: '🐶' // Fallback to giveaway dog emoji
};

// Mock user data for preview
const mockUserProfile: UserProfileSchema = {
  id: 'preview-user',
  name: 'Preview User',
  email: 'user@example.com',
  emailVerified: true,
  emoji: '🐶',
  region: 'US',
  age: 25
};

const mockParticipation: GiveawayParticipationSchema = {
  totalEntries: 1247,
  totalUsers: 357
};

const mockUserParticipation: UserParticipationSchema = {
  entries: 12,
  completedTasks: ['task-0'] // First task completed for demo
};

const mockWinners: GiveawayWinnerSchema[] = [];

export const GiveawayPreview: React.FC = () => {
  const { control } = useFormContext<GiveawayFormSchema>();
  const { previewState } = usePreviewState();

  // Watch all form values for live preview
  const formValues = useWatch({ control });

  const mockSweepstakes: GiveawayFormSchema | undefined = useMemo(() => {
    try {
      // Check if we have minimum required data
      if (
        !formValues?.setup?.name &&
        !formValues.tasks?.length &&
        !formValues?.prizes?.length
      ) {
        return undefined;
      }

      return {
        setup: {
          name: formValues.setup?.name ?? DEFAULT_SWEEPSTAKES_NAME,
          description: formValues.setup?.description ?? '',
          banner: formValues.setup?.banner ?? ''
        },
        terms:
          formValues?.terms?.type === SweepstakesTermsType.TEMPLATE
            ? {
                type: SweepstakesTermsType.TEMPLATE,
                ...formValues?.terms,
                ...defaultTermInputOptions
              }
            : formValues?.terms?.type === SweepstakesTermsType.CUSTOM
              ? {
                  type: SweepstakesTermsType.CUSTOM,
                  text: formValues?.terms?.text || ''
                }
              : {
                  type: SweepstakesTermsType.CUSTOM,
                  text: ''
                },
        timing: {
          startDate: formValues.timing?.startDate || new Date(),
          endDate:
            formValues.timing?.endDate ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          timeZone: formValues.timing?.timeZone || 'UTC'
        },
        audience: {
          requireEmail: formValues.audience?.requireEmail ?? true,
          regionalRestriction: formValues.audience?.regionalRestriction
            ? {
                regions: formValues.audience.regionalRestriction.regions || [],
                filter:
                  formValues.audience.regionalRestriction.filter ||
                  RegionalRestrictionFilter.INCLUDE
              }
            : undefined,
          minimumAgeRestriction: formValues.audience?.minimumAgeRestriction
            ? {
                format: MinimumAgeRestrictionFormat.CHECKBOX,
                value: formValues.audience.minimumAgeRestriction.value || 13,
                label: formValues.audience.minimumAgeRestriction.label || '',
                required:
                  formValues.audience.minimumAgeRestriction.required || false
              }
            : undefined
        },
        tasks: (formValues.tasks || []) as TaskSchema[],
        prizes: (formValues.prizes || []) as Prize[]
      };
    } catch (error) {
      console.warn('Error creating preview data:', error);
      return undefined;
    }
  }, [formValues]);

  if (!mockSweepstakes) {
    if (!formValues || Object.keys(formValues).length === 0) {
      return <GiveawayParticipationSkeleton />;
    }

    return (
      <div className="w-full">
        <IncompleteGiveawaySetup />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <GiveawayParticipation
        isLoading={false}
        sweepstakes={mockSweepstakes}
        host={mockHost}
        participation={mockParticipation}
        winners={mockWinners}
        userProfile={mockUserProfile}
        userParticipation={mockUserParticipation}
        state={previewState}
        onTaskComplete={noop}
        onLogin={noop}
        onCompleteProfile={noop}
      />
    </div>
  );
};
