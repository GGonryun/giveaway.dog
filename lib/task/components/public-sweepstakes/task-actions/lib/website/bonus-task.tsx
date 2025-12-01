import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@/components/ui/button';
import { BonusTaskSchema } from '@/lib/task/schemas';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../../../../theme';
import React from 'react';

export const BonusTaskActionForm: React.FC<
  TaskActionProps<BonusTaskSchema>
> = ({ task, onSubmit }) => {
  const { theme } = useTaskTheme();

  return (
    <TaskContent className="flex-col">
      <Button className={cn(theme.action)} onClick={onSubmit}>
        Continue
      </Button>
    </TaskContent>
  );
};
