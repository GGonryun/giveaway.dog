'use client';

import React, { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { GiveawayParticipation } from '@/components/giveaway/giveaway-participation';
import { GiveawayParticipationSkeleton } from '@/components/giveaway/fallbacks/giveaway-skeleton';
import { IncompleteGiveawaySetup } from '@/components/giveaway/fallbacks/empty-states';

import {
  GiveawayParticipationData,
  GiveawaySchema,
  GiveawayWinner,
  Prize,
  Task,
  UserParticipation,
  UserProfile
} from '@/schemas/giveaway';
import { usePreviewState } from '../contexts/preview-state-context';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/lib/settings';

const mockHost = {
  id: 'preview-host-id',
  name: 'Preview Host',
  avatar: '🐶' // Fallback to giveaway dog emoji
};

// Mock user data for preview
const mockUserProfile: UserProfile = {
  id: 'preview-user',
  name: 'Preview User',
  email: 'user@example.com',
  avatar: '/api/placeholder/32/32',
  region: 'US',
  age: 25
};

const mockParticipation: GiveawayParticipationData = {
  id: 'preview-giveaway',
  totalEntries: 1247
};

const mockUserParticipation: UserParticipation = {
  entries: 12,
  completedTasks: ['task-0'] // First task completed for demo
};

const mockWinners: GiveawayWinner[] = [];

export const GiveawayPreview: React.FC = () => {
  const { control } = useFormContext<GiveawaySchema>();
  const { previewState } = usePreviewState();

  // Watch all form values for live preview
  const formValues = useWatch({ control });

  const giveawayData: GiveawaySchema | null = useMemo(() => {
    try {
      // Check if we have minimum required data
      if (
        !formValues?.setup?.name &&
        !formValues.tasks?.length &&
        !formValues?.prizes?.length
      ) {
        return null;
      }

      return {
        setup: {
          name: formValues.setup?.name || DEFAULT_SWEEPSTAKES_NAME,
          description: formValues.setup?.description || '',
          banner: formValues.setup?.banner || undefined, // Only show banner if provided
          terms: formValues.setup?.terms || ''
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
                  formValues.audience.regionalRestriction.filter || 'include'
              }
            : null,
          minimumAgeRestriction: formValues.audience?.minimumAgeRestriction
            ? {
                format: 'checkbox' as const,
                value: formValues.audience.minimumAgeRestriction.value || 13,
                label: formValues.audience.minimumAgeRestriction.label || '',
                required:
                  formValues.audience.minimumAgeRestriction.required || false
              }
            : null
        },
        tasks: (formValues.tasks || []) as Task[],
        prizes: (formValues.prizes || []) as Prize[]
      };
    } catch (error) {
      console.warn('Error creating preview data:', error);
      return null;
    }
  }, [formValues]);

  // Handle different states of data availability
  if (!giveawayData) {
    // Check if we have any form data at all
    if (!formValues || Object.keys(formValues).length === 0) {
      return <GiveawayParticipationSkeleton />;
    }

    // We have some data but not enough for a preview
    return (
      <div className="w-full">
        <IncompleteGiveawaySetup />
      </div>
    );
  }

  return (
    <div className="w-full">
      <GiveawayParticipation
        giveaway={giveawayData}
        host={mockHost}
        participation={mockParticipation}
        winners={mockWinners}
        user={{
          profile: mockUserProfile,
          participation: mockUserParticipation
        }}
        state={previewState}
        onTaskComplete={(taskId) => {}}
        onLogin={() => {}}
        onCompleteProfile={() => {}}
      />
    </div>
  );
};
