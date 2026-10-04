'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { TemplateFormSchema } from '../../schemas/template';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { FileUpload } from '@/components/ui/file-upload';
import { MinimalTiptap } from '@/components/ui/minimal-tiptap-editor';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';

export const TemplateSetup = () => {
  const form = useFormContext<TemplateFormSchema>();
  const { action } = useUnifiedFormLayout();

  return (
    <UnifiedSectionHeader
      label="Sweepstakes Setup"
      description="Default details for sweepstakes created from this template"
    >
      <FormField
        control={form.control}
        name="setup.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter a default name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="setup.banner"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Banner</FormLabel>
            <FormControl>
              <FileUpload
                className="items-start"
                isDemo={action === 'demo'}
                initialUrl={field.value ?? undefined}
                onUpload={(url) => field.onChange(url || null)}
                size="wide"
                fillPreview
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="setup.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Description</FormLabel>
            <FormControl>
              <MinimalTiptap
                content={field.value}
                onChange={field.onChange}
                placeholder="Enter a default description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </UnifiedSectionHeader>
  );
};
