'use client';

import React, { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { GiveawayParticipationSkeleton } from '@giveaway/sweepstakes-ui/fallbacks/giveaway-skeleton';
import { IncompleteGiveawaySetup } from '@giveaway/sweepstakes-ui/fallbacks/empty-states';

import {
  GiveawayDesignBackgroundSchema,
  GiveawayFormSchema,
  GiveawayPrizeSchema,
  GiveawaySchema,
  GiveawayState,
  Prize
} from '@giveaway/sweepstakes-model/schemas';
import { usePreviewState } from './contexts/preview-state-context';
import {
  SweepstakesFormFieldType,
  RegionalRestrictionFilter,
  SweepstakesTermsType
} from '@prisma/client';
import { defaultTermInputOptions } from '@giveaway/sweepstakes-model/terms';
import { DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND } from '@giveaway/sweepstakes-model/defaults';
import {
  mockParticipation,
  mockUserHostRelationship,
  onFakeLogin,
  onFakeCompleteProfile,
  onFakeTaskComplete,
  onFakeFormSubmit,
  mockParticipant,
  mockUserReferral,
  onFakeCreateReferral,
  onFakeTaskUpdate,
  onFakeAllocate,
  mockAllocation
} from '@giveaway/sweepstakes-demo/mocks';
import { TaskSchema } from '@giveaway/task-model/schemas';
import { useTeams } from '@giveaway/team-context/team-provider';
import { toSweepstakesHost } from '@giveaway/participant-model/participant';
import { assertNever } from '@giveaway/util-errors';
import {
  DEFAULT_ALLOWED_IDENTITIES,
  DEFAULT_SWEEPSTAKES_NAME,
  TWITTER_PROFILE_URL
} from '@giveaway/app-config/settings';
import { DeepNil, DeepPartial } from '@giveaway/util-types/types';
import { isDefined } from '@giveaway/util-types/widetype';
import { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { DEFAULT_MINIMUM_AGE } from '@giveaway/custom-fields-model/defaults';
import { SweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';

export const SweepstakesFormPreview: React.FC = () => {
  const { control } = useFormContext<GiveawayFormSchema>();

  const formValues = useWatch({ control });

  return <SweepstakesSharedFormPreview formValues={formValues} />;
};

export const SweepstakesSharedFormPreview: React.FC<{
  formValues: DeepPartial<GiveawayFormSchema>;
}> = ({ formValues }) => {
  const { activeTeam } = useTeams();
  const { previewState } = usePreviewState();

  const formPrizes = (formValues?.prizes || []) as Prize[];
  const mockPrizes: GiveawayPrizeSchema[] = formPrizes.map((prize, index) => ({
    prizeId: prize.id || `prize-${index + 1}`,
    prizeName: prize.name || `Prize ${index + 1}`,
    quota: prize.quota || 1,
    draws: []
  }));

  const mockSweepstakes: GiveawaySchema | undefined = useMemo(() => {
    try {
      // Check if we have minimum required data
      if (
        !formValues?.setup?.name &&
        !formValues?.tasks?.length &&
        !formValues?.prizes?.length
      ) {
        return undefined;
      }

      return {
        id: 'preview-sweepstakes-id',
        status: 'RUNNING' as const,
        setup: {
          name: formValues?.setup?.name ?? DEFAULT_SWEEPSTAKES_NAME,
          description: formValues?.setup?.description ?? '',
          banner: formValues?.setup?.banner ?? ''
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
          startDate: formValues?.timing?.startDate || new Date(),
          endDate:
            formValues?.timing?.endDate ||
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          timeZone: formValues?.timing?.timeZone || 'UTC'
        },
        audience: {
          regionalRestriction: formValues?.audience?.regionalRestriction
            ? {
                regions:
                  formValues?.audience?.regionalRestriction?.regions || [],
                filter:
                  formValues?.audience?.regionalRestriction?.filter ||
                  RegionalRestrictionFilter.INCLUDE
              }
            : undefined,
          allowedIdentities:
            formValues?.audience?.allowedIdentities ??
            DEFAULT_ALLOWED_IDENTITIES,
          requirePreEntryLogin:
            formValues?.audience?.requirePreEntryLogin || false,
          formFields: toMockFormFields(formValues?.audience?.formFields)
        },
        tasks: (formValues?.tasks || []) as TaskSchema[],
        prizes: formPrizes,
        design: {
          displayName: formValues?.design?.displayName !== false,
          displayDescription: formValues?.design?.displayDescription !== false,
          aspectRatio: formValues?.design?.aspectRatio || 'VIDEO',
          background: (formValues?.design?.background ||
            DEFAULT_SOLID_COLOR_DESIGN_BACKGROUND) as GiveawayDesignBackgroundSchema
        },
        visibility: {
          visibility: formValues?.visibility?.visibility || 'PRIVATE',
          slug: formValues?.visibility?.slug || ''
        },
        criteria: {
          minTasksCompleted: formValues?.criteria?.minTasksCompleted || 1,
          minQualityScore: formValues?.criteria?.minQualityScore || 50,
          allowMultipleWins: formValues?.criteria?.allowMultipleWins || false,
          allowUserSelection: formValues?.criteria?.allowUserSelection || false
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
      <div className="h-full w-full flex items-center justify-center">
        <IncompleteGiveawaySetup />
      </div>
    );
  }

  return (
    <GiveawayParticipation
      verifyEmail={false}
      sweepstakes={mockSweepstakes}
      host={toSweepstakesHost(activeTeam)}
      participation={mockParticipation}
      prizes={mockPrizes}
      participant={getPreviewParticipant(
        mockSweepstakes,
        mockPrizes,
        previewState
      )}
      relationship={getPreviewRelationship(previewState)}
      state={previewState}
      referral={mockUserReferral}
      isPreview={true}
      onAllocate={onFakeAllocate}
      onCreateReferral={onFakeCreateReferral}
      onTaskComplete={onFakeTaskComplete}
      onTaskUpdate={onFakeTaskUpdate}
      onLogin={onFakeLogin}
      onCompleteProfile={onFakeCompleteProfile}
      onFormSubmit={onFakeFormSubmit}
    />
  );
};

const toMockFormFields = (fields?: DeepNil<SweepstakesFormFieldSchema>[]) => {
  if (!fields) return [];

  return fields.filter(isDefined('type')).map((field) => {
    switch (field.type) {
      case 'USERNAME':
        return {
          id: field.id ?? '',
          label: field.label ?? '',
          type: SweepstakesFormFieldType.USERNAME,
          required: field.required || false,
          placeholder: field.placeholder || ''
        };
      case 'EMAIL':
        return {
          id: field.id ?? '',
          label: field.label ?? '',
          type: SweepstakesFormFieldType.EMAIL,
          placeholder: field.placeholder || ''
        };
      case 'AGE':
        return {
          id: field.id ?? '',
          label: field.label ?? '',
          type: SweepstakesFormFieldType.AGE,
          required: field.required || false,
          minimum: field.minimum || DEFAULT_MINIMUM_AGE,
          maximum: field.maximum || 99
        };
      case 'TWITTER':
        return {
          id: field.id ?? '',
          label: field.label ?? '',
          type: SweepstakesFormFieldType.TWITTER,
          required: field.required || false,
          placeholder: field.placeholder || TWITTER_PROFILE_URL
        };
      default:
        throw assertNever(field);
    }
  });
};

export const getPreviewParticipant = (
  sweepstakes: GiveawaySchema,
  prizes: GiveawayPrizeSchema[],
  previewState: GiveawayState
): SweepstakesParticipantSchema | undefined => {
  switch (previewState) {
    case 'not-logged-in':
    case 'profile-incomplete':
      return undefined;
    case 'no-prize-allocation':
      return {
        ...mockParticipant,
        allocation: null
      };
    case 'active':
    case 'pending':
    case 'not-eligible':
    case 'winners-announced':
    case 'winners-pending':
    case 'closed':
    case 'canceled':
    case 'error': {
      if (!sweepstakes.criteria.allowUserSelection) {
        return { ...mockParticipant, allocation: null };
      }
      return { ...mockParticipant, allocation: mockAllocation(prizes) };
    }
    default:
      throw assertNever(previewState);
  }
};

export const getPreviewRelationship = (previewState: GiveawayState) => {
  switch (previewState) {
    case 'not-logged-in':
      return undefined;
    case 'active':
    case 'pending':
    case 'not-eligible':
    case 'profile-incomplete':
    case 'winners-announced':
    case 'winners-pending':
    case 'no-prize-allocation':
    case 'closed':
    case 'canceled':
    case 'error':
      return mockUserHostRelationship;
    default:
      throw assertNever(previewState);
  }
};
