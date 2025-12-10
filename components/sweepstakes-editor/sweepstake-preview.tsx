'use client';

import React, { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { GiveawayParticipationSkeleton } from '@/components/sweepstakes/fallbacks/giveaway-skeleton';
import { IncompleteGiveawaySetup } from '@/components/sweepstakes/fallbacks/empty-states';

import {
  GiveawayDesignBackgroundSchema,
  GiveawayFormSchema,
  GiveawaySchema,
  GiveawayState,
  Prize
} from '@/schemas/giveaway/schemas';
import { usePreviewState } from './contexts/preview-state-context';
import {
  MinimumAgeRestrictionFormat,
  RegionalRestrictionFilter,
  SweepstakesTermsType
} from '@prisma/client';
import { defaultTermInputOptions } from './form/terms';
import {
  DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND,
  DEFAULT_SWEEPSTAKES_NAME
} from '@/schemas/giveaway/defaults';
import {
  mockParticipation,
  mockWinners,
  mockUserProfile,
  mockUserParticipation,
  mockUserHostRelationship,
  onFakeLogin,
  onFakeCompleteProfile,
  onFakeTaskComplete
} from './data/mocks';
import { TaskSchema } from '@/lib/task/schemas';
import { useTeams } from '../context/team-provider';
import { toSweepstakesHost } from '@/schemas/giveaway/participant';
import { assertNever } from '@/lib/errors';
import { UserProfileSchema } from '@/schemas/user';
import { DEFAULT_ALLOWED_IDENTITIES } from '@/lib/settings';
import { RequirePreEntryLogin } from './form/audience/require-pre-entry-login';

export const SweepstakePreview: React.FC = () => {
  const { activeTeam } = useTeams();
  const { control } = useFormContext<GiveawayFormSchema>();
  const { previewState } = usePreviewState();

  // Watch all form values for live preview
  const formValues = useWatch({ control });

  const mockSweepstakes: GiveawaySchema | undefined = useMemo(() => {
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
        id: 'preview-sweepstakes-id',
        status: 'RUNNING' as const,
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
            : undefined,
          allowedIdentities:
            formValues.audience?.allowedIdentities ??
            DEFAULT_ALLOWED_IDENTITIES,
          requirePreEntryLogin:
            formValues.audience?.requirePreEntryLogin || false
        },
        tasks: (formValues.tasks || []) as TaskSchema[],
        prizes: (formValues.prizes || []) as Prize[],
        design: {
          displayName: formValues.design?.displayName !== false,
          displayDescription: formValues.design?.displayDescription !== false,
          background: (formValues.design?.background ||
            DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND) as GiveawayDesignBackgroundSchema
        },
        visibility: {
          visibility: formValues.visibility?.visibility || 'PRIVATE',
          slug: formValues.visibility?.slug || ''
        },
        criteria: {
          minTasksCompleted: formValues.criteria?.minTasksCompleted || 1,
          minQualityScore: formValues.criteria?.minQualityScore || 70,
          allowMultipleWins: formValues.criteria?.allowMultipleWins || false
        }
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
    <GiveawayParticipation
      sweepstakes={mockSweepstakes}
      host={toSweepstakesHost(activeTeam)}
      participation={mockParticipation}
      prizes={mockWinners}
      userProfile={getUserProfile(previewState)}
      userParticipation={getUserParticipation(previewState)}
      userHostRelationship={getUserHostRelationship(previewState)}
      state={previewState}
      onTaskComplete={onFakeTaskComplete}
      onLogin={onFakeLogin}
      onCompleteProfile={onFakeCompleteProfile}
      verifyEmail={false}
    />
  );
};

const getUserProfile = (
  previewState: GiveawayState
): UserProfileSchema | undefined => {
  switch (previewState) {
    case 'not-logged-in':
      return undefined;
    case 'active':
    case 'pending':
    case 'email-required':
      return { ...mockUserProfile, email: '', emailVerified: false };
    case 'age-verification-required':
    case 'not-eligible':
    case 'profile-incomplete':
    case 'winners-announced':
    case 'winners-pending':
    case 'closed':
    case 'canceled':
    case 'error':
      return mockUserProfile;
    default:
  }
};

const getUserParticipation = (previewState: GiveawayState) => {
  switch (previewState) {
    case 'not-logged-in':
      return undefined;
    case 'active':
    case 'pending':
    case 'email-required':
    case 'age-verification-required':
    case 'not-eligible':
    case 'profile-incomplete':
    case 'winners-announced':
    case 'winners-pending':
    case 'closed':
    case 'canceled':
    case 'error':
      return mockUserParticipation;
    default:
      throw assertNever(previewState);
  }
};

const getUserHostRelationship = (previewState: GiveawayState) => {
  switch (previewState) {
    case 'not-logged-in':
      return undefined;
    case 'active':
    case 'pending':
    case 'email-required':
    case 'age-verification-required':
    case 'not-eligible':
    case 'profile-incomplete':
    case 'winners-announced':
    case 'winners-pending':
    case 'closed':
    case 'canceled':
    case 'error':
      return mockUserHostRelationship;
    default:
      throw assertNever(previewState);
  }
};
