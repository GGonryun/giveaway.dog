import { useFormContext } from 'react-hook-form';
import { GiveawayFormSchema } from '@/schemas/giveaway/schemas';
import { Switch } from '@giveaway/ui-primitives/switch';
import {
  SwitchBox,
  SwitchFormHeader
} from '@giveaway/ui-layouts/form-layout/switch-form-header';
import { toDefaultValues } from '@giveaway/task-model/defaults';
import { nanoid } from 'nanoid';

export const EnableAutomaticProfileEntry = () => {
  const form = useFormContext<GiveawayFormSchema>();
  const tasks = form.watch('tasks') || [];

  const hasProfileTask = tasks.some(
    (task) => task.type === 'BONUS_COMPLETE_PROFILE'
  );

  const handleToggle = (checked: boolean) => {
    if (checked) {
      const defaultTask = toDefaultValues('BONUS_COMPLETE_PROFILE');
      const newTask = {
        ...defaultTask,
        id: nanoid()
      };
      form.setValue('tasks', [newTask, ...tasks]);
    } else {
      const filteredTasks = tasks.filter(
        (task) => task.type !== 'BONUS_COMPLETE_PROFILE'
      );
      form.setValue('tasks', filteredTasks);
    }
  };

  return (
    <SwitchBox>
      <div className="flex flex-row items-start justify-between">
        <SwitchFormHeader
          label="Reward Profile Completion"
          description="Give participants bonus entries for completing their profile"
          help={{
            title: 'Help: Reward Profile Completion',
            content: (
              <div className="space-y-2">
                <p>
                  When enabled, participants will automatically receive bonus
                  entries when they complete their profile information during
                  the entry process.
                </p>
                <p>
                  This incentivizes users to provide complete information and
                  helps you collect better participant data.
                </p>
                <p className="text-sm text-muted-foreground">
                  Note: The profile completion task will be automatically added
                  to your entry methods and cannot be manually edited or removed
                  while this setting is enabled.
                </p>
              </div>
            )
          }}
        />
        <Switch checked={hasProfileTask} onCheckedChange={handleToggle} />
      </div>
    </SwitchBox>
  );
};
