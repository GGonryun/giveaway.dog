import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@/components/ui/button';
import {
  BonusTaskSchema,
  BonusCompleteProfileTaskSchema
} from '@/lib/task/schemas';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../../../../theme';
import React from 'react';
import { Typography } from '@/components/ui/typography';
import { CheckCircle2 } from 'lucide-react';

export const BonusTaskActionForm: React.FC<
  TaskActionProps<BonusTaskSchema | BonusCompleteProfileTaskSchema>
> = ({ task, onSubmit }) => {
  const { theme } = useTaskTheme();

  return (
    <TaskContent className="flex-col">
      <Button className={cn(theme.action)} onClick={onSubmit}>
        {task.type === 'BONUS_COMPLETE_PROFILE'
          ? 'Complete Profile'
          : 'Continue'}
      </Button>
    </TaskContent>
  );
};
