'use client';

import React from 'react';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';
import { AllowedIdentities } from '@/components/sweepstakes-editor/form/audience/allowed-identities';
import { RequirePreEntryLogin } from '@/components/sweepstakes-editor/form/audience/require-pre-entry-login';
import { CustomFormFields } from '@/lib/custom-fields/components/custom-form-fields';
import { RegionalRestriction } from '@/components/sweepstakes-editor/form/audience/regional-restriction';
import { useFormContext } from 'react-hook-form';
import { TemplateFormSchema } from '../../schemas/template';
import {
  VisibilityTypeField,
  UrlSlugField
} from '@/components/sweepstakes-editor/form/audience/sweepstakes-visibility';

export const TemplateAudience = () => {
  const form = useFormContext<TemplateFormSchema>();

  return (
    <>
      <UnifiedSectionHeader
        label="Identity"
        description="Default login options for participants"
      >
        <AllowedIdentities form={form} fieldPath="audience.allowedIdentities" />
        <RequirePreEntryLogin
          form={form}
          fieldPath="audience.requirePreEntryLogin"
        />
      </UnifiedSectionHeader>

      <UnifiedSectionHeader
        label="User Details"
        description="Default form fields to collect from participants"
        className="border-t"
      >
        <CustomFormFields form={form} fieldPath="audience.formFields" />
      </UnifiedSectionHeader>

      <UnifiedSectionHeader
        label="Location"
        description="Default location restrictions"
        className="border-t"
      >
        <RegionalRestriction
          form={form}
          fieldPath="audience.regionalRestriction"
        />
      </UnifiedSectionHeader>

      <UnifiedSectionHeader
        label="Visibility"
        description="Default visibility settings for the template"
        className="border-t"
      >
        <VisibilityTypeField form={form} fieldPath="visibility.visibility" />
        <UrlSlugField form={form} fieldPath="visibility.slug" />
      </UnifiedSectionHeader>
    </>
  );
};
