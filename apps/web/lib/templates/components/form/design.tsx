'use client';

import { useFormContext } from 'react-hook-form';
import { TemplateFormSchema } from '../../schemas/template';
import {
  DisplayNameField,
  DisplayDescriptionField,
  AspectRatioField,
  BackgroundColor,
  BackgroundFields
} from '@/components/sweepstakes-editor/form/design/design';
import { UnifiedSectionHeader } from '@giveaway/ui-layouts/form-layout/section-header';

export const TemplateDesign = () => {
  const form = useFormContext<TemplateFormSchema>();

  return (
    <>
      <UnifiedSectionHeader
        label="Form Design"
        description="Customize the content and appearance of your sweepstakes form"
      >
        <DisplayNameField form={form} fieldPath="design.displayName" />
        <DisplayDescriptionField
          form={form}
          fieldPath="design.displayDescription"
        />
        <AspectRatioField form={form} fieldPath="design.aspectRatio" />
      </UnifiedSectionHeader>
      <UnifiedSectionHeader
        label="Layout"
        description="Choose the layout and background style for your giveaway"
        className="border-t"
      >
        <BackgroundColor form={form} fieldPath="design.background" />
        <BackgroundFields form={form} fieldPath="design" />
      </UnifiedSectionHeader>
    </>
  );
};
