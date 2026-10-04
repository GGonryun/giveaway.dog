'use client';

import { useGiveawayParticipation } from '../giveaway-participation-context';
import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SweepstakesFormFieldType } from '@prisma/client';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@giveaway/ui-primitives/form';
import { Input } from '@giveaway/ui-primitives/input';
import { Button } from '@giveaway/ui-primitives/button';
import { Typography } from '@giveaway/ui-primitives/typography';
import { Checkbox } from '@giveaway/ui-primitives/checkbox';
import {
  xProfileRefineError,
  xProfileRefineUrl
} from '@giveaway/x-model/twitter';
import { HelpDialog } from '@giveaway/ui-layouts/help-dialog';
import { assertNever } from '@giveaway/util-errors';
import { ArrowRight } from 'lucide-react';
import { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { UserInfoSection } from '../user-info-section';
import { toParticipantForm } from '@giveaway/participant-model/participant';
import { cn } from '@giveaway/ui-utils/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { isFailureData } from '@giveaway/rpc-model/types';
import { useRouter } from 'next/navigation';
import { Spinner } from '@giveaway/ui-primitives/spinner';

const createFormSchema = (formFields: SweepstakesFormFieldSchema[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  formFields.forEach((field) => {
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case SweepstakesFormFieldType.USERNAME:
        fieldSchema = z
          .string()
          .min(1, 'Username must be at least 1 characters')
          .max(50, 'Username must be at most 50 characters');

        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;

      case SweepstakesFormFieldType.AGE:
        fieldSchema = z.boolean().refine((val) => val === true, {
          message: 'You must confirm you meet the age requirement'
        });

        if (!field.required) {
          fieldSchema = fieldSchema.optional();
        }
        break;

      case SweepstakesFormFieldType.EMAIL:
        fieldSchema = z.string().email('Please enter a valid email address');
        break;

      case SweepstakesFormFieldType.TWITTER:
        if (field.required) {
          fieldSchema = z
            .string()
            .min(1, 'Twitter profile is required')
            .url('Please enter a valid URL')
            .refine(xProfileRefineUrl, xProfileRefineError);
        } else {
          fieldSchema = z.string().optional();
        }
        break;

      default:
        throw assertNever(field);
    }

    schemaFields[field.id] = fieldSchema;
  });

  return z.object(schemaFields);
};

function SweepstakesFormField<T extends z.ZodSchema<any>>({
  field,
  hidden
}: {
  field: SweepstakesFormFieldSchema;
  schema: z.infer<T>;
  hidden?: boolean;
}) {
  const form = useFormContext();

  switch (field.type) {
    case SweepstakesFormFieldType.USERNAME:
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem className={cn(hidden && 'hidden')}>
              <FormLabel>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={field.placeholder || field.label}
                  {...formField}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case SweepstakesFormFieldType.AGE:
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem
              className={cn(
                'flex flex-row items-start space-x-3 space-y-0 py-2',
                hidden && 'hidden'
              )}
            >
              <FormControl>
                <Checkbox
                  className="bg-background"
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{field.label}</FormLabel>
              </div>
            </FormItem>
          )}
        />
      );

    case SweepstakesFormFieldType.EMAIL:
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem className={cn(hidden && 'hidden')}>
              <FormLabel>
                {field.label}
                <span className="text-destructive"> *</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={field.placeholder || field.label}
                  {...formField}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case SweepstakesFormFieldType.TWITTER:
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem className={cn(hidden && 'hidden')}>
              <FormLabel className="flex items-center gap-2">
                <span>
                  {field.label}
                  {field.required && (
                    <span className="text-destructive"> *</span>
                  )}
                </span>
                <HelpDialog
                  title="Twitter profile Format"
                  content={
                    <div className="space-y-2">
                      <p>
                        Please enter your Twitter/X profile URL in the following
                        format:
                      </p>
                      <code className="block bg-muted p-2 rounded">
                        https://twitter.com/username
                      </code>
                      <p className="text-sm">or</p>
                      <code className="block bg-muted p-2 rounded">
                        https://x.com/username
                      </code>
                    </div>
                  }
                />
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    field.placeholder || 'https://twitter.com/username'
                  }
                  {...formField}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    default:
      throw assertNever(field);
  }
}

export const UserDetailsForm = () => {
  const router = useRouter();

  const { sweepstakes, participant, onFormSubmit } = useGiveawayParticipation();
  const [submitting, setSubmitting] = useState(false);

  const { formFields } = sweepstakes.audience;

  const profile = toParticipantForm(
    formFields,
    participant?.user,
    participant?.formValues
  );

  const schema = createFormSchema(formFields);
  type FormValues = z.infer<typeof schema>;

  const defaultValues = formFields.reduce<Record<string, any>>((acc, field) => {
    acc[field.id] = profile.find((p) => p.id === field.id)?.value || '';
    return acc;
  }, {});
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues
  });

  const handleFormSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      await onFormSubmit(data);
      toast.success('Form submitted successfully!');
      router.refresh();
    } catch (error) {
      const message = isFailureData(error)
        ? error.message
        : 'An unexpected error occurred. Please try again later.';
      form.setError('root', {
        type: 'server',
        message
      });
      toast.error(message);
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div className="text-center py-10">
        <Typography.Header level={3}>
          Submitting your details...
        </Typography.Header>
        <Typography.Paragraph className="text-muted-foreground mt-2">
          Please wait while we process your information.
        </Typography.Paragraph>
        <Spinner className="mx-auto mt-4" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {participant && <UserInfoSection className="pb-1" />}
      <div className="space-y-1">
        <Typography.Header level={3}>Ready to win?</Typography.Header>
        <Typography.Paragraph className="text-muted-foreground">
          To participate in this sweepstakes, please complete the following
          entry form.
        </Typography.Paragraph>
      </div>
      <Form {...form}>
        <div className="space-y-2">
          {formFields.map((field) => (
            <SweepstakesFormField
              key={field.id}
              field={field}
              schema={schema}
              hidden={!profile.find((p) => p.id === field.id)?.isCustom}
            />
          ))}
          {form.formState.errors.root && (
            <div className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}
          <Button
            type="button"
            onClick={form.handleSubmit(handleFormSubmit)}
            className="w-full mt-2"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Continue to Sweepstakes'}{' '}
            <ArrowRight />
          </Button>
        </div>
      </Form>
    </div>
  );
};
