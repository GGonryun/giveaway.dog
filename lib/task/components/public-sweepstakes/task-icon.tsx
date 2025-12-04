import React from 'react';
import { useTaskTheme } from '../theme';
import { cn } from '@/lib/utils';
import { CompletionStatus } from '@prisma/client';
import { SUBMISSION_COLOR_MAP, SUBMISSION_ICON_MAP } from '../../submission';

export const TaskIcon: React.FC<{
  submission: CompletionStatus | undefined;
}> = ({ submission }) => {
  const { theme } = useTaskTheme();
  const color = submission ? SUBMISSION_COLOR_MAP[submission] : undefined;
  const Icon = submission ? SUBMISSION_ICON_MAP[submission] : undefined;
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
