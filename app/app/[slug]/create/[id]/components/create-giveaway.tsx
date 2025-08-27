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
import { useCallback, useEffect, useState, useTransition } from 'react';
import * as dates from 'date-fns';
import { timezone } from '@/lib/time';

import { FormLayout } from './form-layout';
import { FormDefaultsProvider } from './form/form-defaults-context';
import { SweepstakesStepProvider } from '@/components/hooks/use-sweepstake-step';
import { GiveawayFormContent } from './form-content';
import { GiveawayPreview } from './preview';
import { useTeamPage } from '@/components/team/use-team-page';
import { useTeams } from '@/components/context/team-provider';
import { CancelConfirmationModal } from '@/components/giveaway/cancel-confirmation-modal';
import { useParams } from 'next/navigation';
import { DEFAULT_SWEEPSTAKES_NAME } from '@/lib/settings';

export const GiveawayForm: React.FC = () => {
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [cancelId, setCancelId] = useState<string | null>(null);

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
    setCancelId(params.id as string | null);
  }, []);

  return (
    <SweepstakesStepProvider>
      <FormProvider {...form}>
        <FormDefaultsProvider defaultValues={defaultValues}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormLayout
              title={name || DEFAULT_SWEEPSTAKES_NAME}
              onCancel={handleCancel}
              disabled={isPending}
              left={<GiveawayFormContent />}
              right={<GiveawayPreview />}
            />
          </form>

          <CancelConfirmationModal
            onClose={() => setCancelId(null)}
            sweepstakesName={name || DEFAULT_SWEEPSTAKES_NAME}
            sweepstakesId={cancelId}
          />
        </FormDefaultsProvider>
      </FormProvider>
    </SweepstakesStepProvider>
  );
};
