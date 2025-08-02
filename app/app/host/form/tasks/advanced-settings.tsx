import { useArrayContext } from '@/components/hooks/use-array-context';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { Typography } from '@/components/ui/typography';
import { assertNever } from '@/lib/errors';
import { TaskType, GiveawayFormSchema } from '../../schema';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { SwitchBox, SwitchFormHeader } from '../switch-box';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export const AdvancedSettings: React.FC<{ type: TaskType }> = ({ type }) => {
  const content = useCallback(() => {
    switch (type) {
      case 'bonus-task':
        return (
          <>
            <MandatoryField />
            <TasksRequiredField />
          </>
        );
      case 'visit-url':
        return (
          <>
            <MandatoryField />
            <TasksRequiredField />
          </>
        );
      default:
        throw assertNever(type);
    }
  }, []);

  return (
    <div className="space-y-1 pt-2">
      <AdvancedLabel />
      <div className="space-y-2">{content()}</div>
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
          <FormItem className="flex flex-row items-center justify-between">
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
  const form = useFormContext<GiveawayFormSchema>();

  return (
    <SwitchBox>
      <FormField
        control={form.control}
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
          </FormItem>
        )}
      />
    </SwitchBox>
  );
};
