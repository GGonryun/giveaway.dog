'use client';

import React from 'react';
import { RegionalRestriction } from './regional-restriction';
import { SweepstakesVisibility } from './sweepstakes-visibility';

import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { AllowedIdentities } from './allowed-identities';
import { RequirePreEntryLogin } from './require-pre-entry-login';
import { CustomFormFields } from '@/lib/custom-fields/components/custom-form-fields';
import { EnableAutomaticProfileEntry } from './enable-automatic-profile-entry';
import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';

export const Audience = () => {
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <>
      <UnifiedSectionHeader
        label="Identity"
        description="Customize how users log in to participate"
      >
        <AllowedIdentities form={form} fieldPath="audience.allowedIdentities" />
        <RequirePreEntryLogin
          form={form}
          fieldPath="audience.requirePreEntryLogin"
        />
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="User Details"
        description="Require specific information from participants"
        className="border-t"
      >
        <CustomFormFields form={form} fieldPath="audience.formFields" />
        <EnableAutomaticProfileEntry />
        {/* <RequireEmail />
        <MinimumAgeRestriction /> */}
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="Location"
        description="Restrict participation based on users' location"
        className="border-t"
      >
        <RegionalRestriction
          form={form}
          fieldPath="audience.regionalRestriction"
        />
      </UnifiedSectionHeader>

      <UnifiedSectionHeader
        label="Visibility"
        description="Configure who can see your sweepstakes and how they access it"
        className="border-t"
      >
        <SweepstakesVisibility />
      </UnifiedSectionHeader>
    </>
  );
};
