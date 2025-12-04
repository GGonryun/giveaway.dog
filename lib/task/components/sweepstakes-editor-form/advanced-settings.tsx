'use client';

import { useArrayContext } from '@/components/hooks/use-array-context';
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Typography } from '@/components/ui/typography';
import { assertNever } from '@/lib/errors';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  SwitchBox,
  SwitchFormHeader
} from '@/components/patterns/form-layout/switch-form-header';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { TaskType } from '@prisma/client';

export const AdvancedSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'VISIT_URL':
      case 'TWITTER_CONNECT':
      case 'TWITTER_FOLLOW':
      case 'STEAM_WISHLIST':
      case 'DISCORD_JOIN':
      case 'TWITCH_FOLLOW':
      case 'KICK_FOLLOW':
      case 'SECRET_CODE':
      case 'YOUTUBE_VISIT':
      case 'TWITTER_LIKE':
      case 'BONUS_TIMED':
      case 'BONUS_TASK':
      case 'BONUS_LIMITED':
      case 'BONUS_LOYALTY':
      case 'TWITTER_RETWEET':
        return (
          <>
            <MandatoryField />
            <TasksRequiredField />
          </>
        );
      case 'TWITTER_RETWEET_IMPORT':
      case 'TWITTER_LIKE_IMPORT':
        return null;
      default:
        throw assertNever(type);
    }
  }, []);

  const show = content();

  if (!show) {
    return null;
  }

  return (
    <div className="space-y-1">
      <AdvancedLabel />
      <div className="space-y-2">{show}</div>
    </div>
  );
};

const AdvancedLabel: React.FC = () => {
  return <Typography.Paragraph weight="medium">Advanced</Typography.Paragraph>;
};

const MandatoryField: React.FC = () => {
  const index = useArrayContext();
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
        name={`tasks.${index}.mandatory`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-start justify-between">
            <SwitchFormHeader
              label="Mandatory"
              description="Users must complete this task to access non-mandatory tasks"
              help={{
                title: 'Help: Mandatory Tasks',
                content: (
                  <p>
                    Mandatory tasks can be used to gate access to other tasks.
                    These should usually be tasks that are required for the
                    giveaway, such as following on social media or subscribing
                    to a newsletter.
                  </p>
                )
              }}
            />
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};

const TasksRequiredField: React.FC = () => {
  const index = useArrayContext();
  const { control } = useFormContext<GiveawayFormSchema>();
  const tasks = useWatch({
    control,
    name: 'tasks'
  });

  if (tasks.length <= 1) {
    return null;
  }

  return (
    <SwitchBox>
      <FormField
        control={control}
        name={`tasks.${index}.tasksRequired`}
        render={({ field }) => (
          <FormItem className="grid grid-cols-[1fr_80px] gap-2 items-center">
            <SwitchFormHeader
              label="Tasks Required"
              description="Locked until this many other tasks are completed"
              help={{
                title: 'Help: Tasks Required',
                content: (
                  <p>
                    Task requirements can be used to lock this task until a
                    certain number of other tasks are completed.
                  </p>
                )
              }}
            />
            <FormControl>
              <Input
                type="number"
                value={String(field.value ?? 0)}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (isNaN(value) || value < 0) {
                    field.onChange(0);
                  } else {
                    field.onChange(value);
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};
