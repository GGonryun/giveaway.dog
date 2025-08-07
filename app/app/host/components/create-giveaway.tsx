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
import { useEffect, useTransition, useRef } from 'react';
import * as dates from 'date-fns';
import { timezone } from '@/lib/time';

import { Setup } from './form/setup/setup';
import { Audience } from './form/audience/audience';
import { EntryMethods } from './form/tasks/entry-methods';
import { Prizes } from './form/prizes/prizes';
import { TakiEasterEgg } from '@/components/patterns/taki-easter-egg';
import { FormLayout } from './form-layout';
import { useSearchParams } from 'next/navigation';
import { FormDefaultsProvider } from './form/form-defaults-context';

const GiveawayFormContent: React.FC = () => {
  const searchParams = useSearchParams();
  const step = searchParams.get('step') ?? 'setup';

  return (
    <>
      {step === 'setup' && <Setup />}
      {step === 'audience' && <Audience />}
      {step === 'tasks' && <EntryMethods />}
      {step === 'prizes' && <Prizes />}
    </>
  );
};

const GiveawayPreview: React.FC = () => {
  return <TakiEasterEgg />;
};

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
    <FormProvider {...form}>
      <FormDefaultsProvider defaultValues={defaultValues}>
        <FormLayout
          title={name || 'New Sweepstakes'}
          onSubmit={form.handleSubmit(handleSubmit)}
          disabled={isPending}
          leftSide={<GiveawayFormContent />}
          rightSide={<GiveawayPreview />}
        />
      </FormDefaultsProvider>
    </FormProvider>
  );
};
