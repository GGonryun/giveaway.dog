import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@/components/ui/button';
import { BonusLimitedTaskSchema } from '@/lib/task/schemas';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../../../../theme';
import React, { useState } from 'react';
import pluralize from 'pluralize';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export const BonusLimitedActionForm: React.FC<
  TaskActionProps<BonusLimitedTaskSchema>
> = ({ task, onSubmit, entrants, submission }) => {
  const { theme } = useTaskTheme();

  return (
    <TaskContent className="flex-col gap-4">
      {submission ? (
        <p className="text-sm text-foreground mt-2">
          You have already claimed this limited bonus. Thank you!
        </p>
      ) : (
        <>
          <Button className={cn(theme.action)} onClick={onSubmit}>
            Continue
          </Button>
          <Remaining entrants={entrants} max={task.maxEntrants} />
        </>
      )}
    </TaskContent>
  );
};

const Remaining: React.FC<{ entrants: number; max: number }> = ({
  entrants,
  max
}) => {
  const { theme } = useTaskTheme();
  const [open, setOpen] = useState(false);

  if (entrants >= max) {
    return (
      <p className="text-sm">
        This task is no longer accepting entries ({max} / {max})
      </p>
    );
  }

  return (
    <p className="text-sm">
      This task has{' '}
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          type="button"
          onClick={(e) => {
            e.preventDefault();
            return setOpen(!open);
          }}
        >
          <span className="font-semibold cursor-help underline">
            {max - entrants} {pluralize('entry', max - entrants)} remaining
          </span>
        </TooltipTrigger>
        <TooltipContent className={theme.arrow} arrowClassName={theme.arrow}>
          Max entries allowed: {max}
        </TooltipContent>
      </Tooltip>
    </p>
  );
};
