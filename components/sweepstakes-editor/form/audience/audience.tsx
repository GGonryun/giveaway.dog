'use client';

import React from 'react';
import { RegionalRestriction } from './regional-restriction';
import { SweepstakesVisibility } from './sweepstakes-visibility';

import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { AllowedIdentities } from './allowed-identities';
import { RequirePreEntryLogin } from './require-pre-entry-login';
import { CustomFormFields } from '@/lib/custom-fields/components/custom-form-fields';

export const Audience = () => {
  return (
    <>
      <UnifiedSectionHeader
        label="Identity"
        description="Customize how users log in to participate"
      >
        <AllowedIdentities />
        <RequirePreEntryLogin />
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="User Details"
        description="Require specific information from participants"
        className="border-t"
      >
        <CustomFormFields />
        {/* <RequireEmail />
        <MinimumAgeRestriction /> */}
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="Location"
        description="Restrict participation based on users' location"
        className="border-t"
      >
        <RegionalRestriction />
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
