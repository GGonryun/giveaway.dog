'use client';

import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TemplateFormSchema } from '../../schemas/template';
import { UnifiedSectionHeader } from '@/components/patterns/form-layout/section-header';
import { FileUpload } from '@/components/ui/file-upload';
import { useUnifiedFormLayout } from '@/components/patterns/form-layout/use-unified-form-layout';
import { Textarea } from '@/components/ui/textarea';

export const TemplateDetails = () => {
  const form = useFormContext<TemplateFormSchema>();
  const { action } = useUnifiedFormLayout();

  return (
    <UnifiedSectionHeader
      label="Template Details"
      description="Basic information about your template"
    >
      <FormField
        control={form.control}
        name="template.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Template Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Social Media Giveaway"
                maxLength={80}
                {...field}
              />
            </FormControl>
            <div className="flex justify-end text-xs text-muted-foreground">
              {(field.value ?? '').length}/80
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="template.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Brief description of this template"
                maxLength={300}
                {...field}
              />
            </FormControl>
            <div className="flex justify-end text-xs text-muted-foreground">
              {(field.value ?? '').length}/300
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="template.image"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Template Image</FormLabel>
            <FormControl>
              <FileUpload
                className="items-start"
                isDemo={action === 'demo'}
                initialUrl={field.value ?? undefined}
                onUpload={(url) => field.onChange(url || '')}
                size="wide"
                fillPreview
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </UnifiedSectionHeader>
  );
};
