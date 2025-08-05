'use client';

import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusIcon, SaveIcon, XIcon } from 'lucide-react';
import {
  GiveawayFormSchema,
  giveawaySchema,
  giveawayFormDefaultValues
} from '../schemas';
import { onSubmitAction } from '../actions';
import { useEffect, useTransition } from 'react';
import * as dates from 'date-fns';
import { timezone } from '@/lib/time';

import { Setup } from './form/setup/setup';
import { Audience } from './form/audience/audience';
import { EntryMethods } from './form/tasks/entry-methods';
import { Prizes } from './form/prizes/prizes';
import { Timing } from './form/timing/timing';
import { Outline } from '../../outline';

export const GiveawayForm: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const form = useForm<GiveawayFormSchema>({
    resolver: zodResolver(giveawaySchema),
    defaultValues: {
      ...giveawayFormDefaultValues,
      timing: {
        startDate: dates.startOfDay(dates.add(Date.now(), { days: 1 })),
        endDate: dates.startOfDay(dates.add(Date.now(), { days: 1, weeks: 1 })),
        timeZone: timezone.current()
      }
    },
    mode: 'onChange'
  });

  const startDate = useWatch({
    control: form.control,
    name: 'timing.startDate'
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
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Outline
          title="New Giveaway"
          type="button"
          action={
            <div className="flex gap-2 justify-self-end">
              <Button type="button" variant="outline" size="sm">
                <XIcon />
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                <SaveIcon />
                Publish
              </Button>
            </div>
          }
        >
          <div className="max-w-lg space-y-2">
            <Setup />
            <Timing />
            <Audience />
            <EntryMethods />
            <Prizes />
          </div>
        </Outline>
      </form>
    </FormProvider>
  );
};
