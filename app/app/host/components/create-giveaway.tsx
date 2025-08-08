'use client';

import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/hooks/use-toast';
import {
  GiveawayFormSchema,
  giveawaySchema,
  giveawayFormDefaultValues
} from '../schemas';
import { onSubmitAction } from '../actions';
import { useEffect, useTransition } from 'react';
import * as dates from 'date-fns';
import { timezone } from '@/lib/time';

import { FormLayout } from './form-layout';
import { FormDefaultsProvider } from './form/form-defaults-context';
import { SweepstakesStepProvider } from '@/components/hooks/use-sweepstake-step';
import { GiveawayFormContent } from './form-content';
import { GiveawayPreview } from './preview';

export const GiveawayForm: React.FC = () => {
  const [isPending, startTransition] = useTransition();

  const defaultValues = {
    ...giveawayFormDefaultValues,
    timing: {
      startDate: dates.startOfDay(dates.add(Date.now(), { days: 1 })),
      endDate: dates.startOfDay(dates.add(Date.now(), { days: 1, weeks: 1 })),
      timeZone: timezone.current()
    }
  };

  const form = useForm<GiveawayFormSchema>({
    resolver: zodResolver(giveawaySchema),
    defaultValues,
    mode: 'onChange'
  });

  const startDate = useWatch({
    control: form.control,
    name: 'timing.startDate'
  });

  const name = useWatch({
    control: form.control,
    name: 'setup.name'
  });

  useEffect(() => {
    form.trigger('timing.endDate');
  }, [startDate, form.trigger]);

  const handleSubmit = async (values: GiveawayFormSchema) => {
    startTransition(async () => {
      try {
        await onSubmitAction(values);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        form.setError('tasks', {
          type: 'manual',
          message: error.message
        });
      }
    });
  };

  return (
    <SweepstakesStepProvider>
      <FormProvider {...form}>
        <FormDefaultsProvider defaultValues={defaultValues}>
          <FormLayout
            title={name || 'New Sweepstakes'}
            onSubmit={form.handleSubmit(handleSubmit)}
            disabled={isPending}
            left={<GiveawayFormContent />}
            right={<GiveawayPreview />}
          />
        </FormDefaultsProvider>
      </FormProvider>
    </SweepstakesStepProvider>
  );
};
