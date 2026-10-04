import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@giveaway/ui-primitives/button';
import { BonusTimedTaskSchema } from '@/lib/task/schemas';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '../../../../theme';
import { datetime } from '@giveaway/util-time/date';
import React, { useState } from 'react';
import { useInterval } from '@giveaway/ui-hooks/use-interval';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@giveaway/ui-primitives/tooltip';

export const BonusTimedActionForm: React.FC<
  TaskActionProps<BonusTimedTaskSchema>
> = ({ task, onSubmit, submission }) => {
  const { theme } = useTaskTheme();

  return (
    <TaskContent className="flex-col gap-4">
      {submission ? (
        <p className="text-sm text-foreground mt-2">
          You have claimed this bonus reward. Thank you!
        </p>
      ) : (
        <>
          <Button className={cn(theme.action)} onClick={onSubmit}>
            Continue
          </Button>
          {task.endDate && (
            <AvailableUntilTimer availableUntil={task.endDate} />
          )}
        </>
      )}
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
      <Tooltip open={open} onOpenChange={setOpen}>
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
