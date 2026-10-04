import { TaskActionProps, TaskContent } from '../../building-blocks';
import { Button } from '@giveaway/ui-primitives/button';
import { BonusLoyaltyTaskSchema } from '@/lib/task/schemas';
import { cn } from '@giveaway/ui-utils/utils';
import { useTaskTheme } from '../../../../theme';
import React from 'react';

export const BonusLoyaltyActionForm: React.FC<
  TaskActionProps<BonusLoyaltyTaskSchema>
> = ({ onSubmit, submission, loyalty }) => {
  const { theme } = useTaskTheme();

  return (
    <TaskContent className="flex-col gap-4">
      {submission ? (
        <p className="text-sm text-foreground mt-2">
          You have already claimed this loyalty bonus. Thank you!
        </p>
      ) : (
        <>
          <Button className={cn(theme.action)} onClick={onSubmit}>
            Continue
          </Button>
          <p className="text-sm">
            You have participated in {loyalty} sweepstakes with this host.
          </p>
        </>
      )}
    </TaskContent>
  );
};
