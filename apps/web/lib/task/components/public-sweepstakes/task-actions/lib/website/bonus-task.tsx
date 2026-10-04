import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@/components/ui/button';
import {
  BonusTaskSchema,
  BonusCompleteProfileTaskSchema
} from '@/lib/task/schemas';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '../../../../theme';
import React from 'react';

export const BonusTaskActionForm: React.FC<
  TaskActionProps<BonusTaskSchema | BonusCompleteProfileTaskSchema>
> = ({ task, submission, onSubmit }) => {
  const { theme } = useTaskTheme();

  return (
    <TaskContent className="flex-col">
      {submission ? (
        <p className="text-sm text-foreground mt-2">
          You have already claimed this bonus. Thank you!
        </p>
      ) : (
        <Button className={cn(theme.action)} onClick={onSubmit}>
          {task.type === 'BONUS_COMPLETE_PROFILE'
            ? 'Complete Profile'
            : 'Continue'}
        </Button>
      )}
    </TaskContent>
  );
};
