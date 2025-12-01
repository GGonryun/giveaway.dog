import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@/components/ui/button';
import { BonusTimedTaskSchema } from '@/lib/task/schemas';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '../../../../theme';
import { datetime } from '@/lib/date';
import React, { useState } from 'react';
import { useInterval } from '@/components/hooks/use-interval';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export const BonusTimedActionForm: React.FC<
  TaskActionProps<BonusTimedTaskSchema>
> = ({ task, onSubmit }) => {
  const { theme } = useTaskTheme();

  return (
    <TaskContent className="flex-col gap-4">
      <Button className={cn(theme.action)} onClick={onSubmit}>
        Continue
      </Button>
      {task.endDate && <AvailableUntilTimer availableUntil={task.endDate} />}
    </TaskContent>
  );
};

const AvailableUntilTimer: React.FC<{ availableUntil: string }> = ({
  availableUntil
}) => {
  const { theme } = useTaskTheme();
  const [open, setOpen] = useState(false);
  const d = new Date(availableUntil);
  const compute = () => {
    return formatDistanceToNow(d);
  };

  const [timer, setTimer] = useState<string>(compute());

  useInterval(() => {
    setTimer(compute());
  }, 1000);

  return (
    <p className="text-sm">
      This task expires in{' '}
      <Tooltip open={open} onOpenChange={(open) => !open && setOpen(open)}>
        <TooltipTrigger
          type="button"
          onClick={(e) => {
            e.preventDefault();
            return setOpen(!open);
          }}
        >
          <span className="font-semibold cursor-help underline">{timer}</span>
        </TooltipTrigger>
        <TooltipContent className={theme.arrow} arrowClassName={theme.arrow}>
          {datetime.format(d)}
        </TooltipContent>
      </Tooltip>
    </p>
  );
};
