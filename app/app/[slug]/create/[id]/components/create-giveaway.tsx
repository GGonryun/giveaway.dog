'use client';

import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  GiveawaySchema,
  giveawaySchema,
  giveawayDefaultValues
} from '@/schemas/giveaway';
import { onSubmitAction } from '../actions';
import { useCallback, useEffect, useTransition } from 'react';
import * as dates from 'date-fns';
import { timezone } from '@/lib/time';

import { FormLayout } from './form-layout';
import { FormDefaultsProvider } from './form/form-defaults-context';
import { SweepstakesStepProvider } from '@/components/hooks/use-sweepstake-step';
import { GiveawayFormContent } from './form-content';
import { GiveawayPreview } from './preview';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/user-provider';
import { useTeamPage } from '@/components/team/use-team-page';

export const GiveawayForm: React.FC = () => {
  const router = useRouter();
  const { navigateToTeam } = useTeamPage();
  const [isPending, startTransition] = useTransition();
  const { activeTeam } = useUser();

  const defaultValues = {
    ...giveawayDefaultValues,
    timing: {
      startDate: dates.startOfDay(dates.add(Date.now(), { days: 1 })),
      endDate: dates.startOfDay(dates.add(Date.now(), { days: 1, weeks: 1 })),
      timeZone: timezone.current()
    }
  };

  const form = useForm<GiveawaySchema>({
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

  const handleSubmit = async (values: GiveawaySchema) => {
    startTransition(async () => {
      try {
        await onSubmitAction(values);
      } catch (error: any) {
        toast('Error', {
          description: error.message
        });
        form.setError('tasks', {
          type: 'manual',
          message: error.message
        });
      }
    });
  };

  const handleCancel = useCallback(() => {
    if (confirm('Are you sure?')) navigateToTeam(activeTeam);
  }, [router, activeTeam.slug]);

  return (
    <SweepstakesStepProvider>
      <FormProvider {...form}>
        <FormDefaultsProvider defaultValues={defaultValues}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormLayout
              title={name || 'New Sweepstakes'}
              onCancel={handleCancel}
              disabled={isPending}
              left={<GiveawayFormContent />}
              right={<GiveawayPreview />}
            />
          </form>
        </FormDefaultsProvider>
      </FormProvider>
    </SweepstakesStepProvider>
  );
};
