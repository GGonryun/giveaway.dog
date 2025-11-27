'use client';

import React from 'react';
import { RegionalRestriction } from './regional-restriction';
import { MinimumAgeRestriction } from './minimum-age-restriction';
import { RequireEmail } from './require-email';
import { SweepstakesVisibility } from './sweepstakes-visibility';

import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';

export const Audience = () => {
  return (
    <>
      <UnifiedSectionHeader
        label="Participation Requirements"
        description="Set the basic requirements for users to participate in your sweepstakes"
      >
        <RequireEmail />
        <RegionalRestriction />
        <MinimumAgeRestriction />
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="Visibility"
        description="Configure the public URL for your sweepstakes"
        className="border-t"
      >
        <SweepstakesVisibility />
      </UnifiedSectionHeader>
    </>
  );
};
