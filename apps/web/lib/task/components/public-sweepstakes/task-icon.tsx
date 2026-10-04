import React from 'react';
import { useTaskTheme } from '@giveaway/task-ui/theme';
import { cn } from '@giveaway/ui-utils/utils';
import { CompletionStatus } from '@prisma/client';
import { SUBMISSION_COLOR_MAP, SUBMISSION_ICON_MAP } from '../../submission';

export const TaskIcon: React.FC<{
  status: CompletionStatus | undefined;
}> = ({ status }) => {
  const { theme } = useTaskTheme();
  const color = status ? SUBMISSION_COLOR_MAP[status] : undefined;
  const Icon = status ? SUBMISSION_ICON_MAP[status] : undefined;
  return (
    <div
      className={cn(
        'flex items-center justify-center min-w-8 w-10 pl-0.5 h-full group-hover:opacity-50 border-r',
        color || theme.symbol
      )}
    >
      {Icon ? <Icon className="h-6 w-6" /> : <theme.icon className="h-6 w-6" />}
    </div>
  );
};
