'use client';

import React from 'react';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';
import { AllowedIdentities } from '@giveaway/sweepstakes-editor-audience/allowed-identities';
import { RequirePreEntryLogin } from '@giveaway/sweepstakes-editor-audience/require-pre-entry-login';
import { CustomFormFields } from '@giveaway/custom-fields-ui/custom-form-fields';
import { RegionalRestriction } from '@giveaway/sweepstakes-editor-audience/regional-restriction';
import { useFormContext } from 'react-hook-form';
import { TemplateFormSchema } from '@giveaway/templates-model/schemas/template';
import {
  VisibilityTypeField,
  UrlSlugField
} from '@giveaway/sweepstakes-editor-audience/sweepstakes-visibility';

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
