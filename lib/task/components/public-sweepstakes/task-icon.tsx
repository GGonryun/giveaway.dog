import React from 'react';
import { useTaskTheme } from '../theme';
import { cn } from '@/lib/utils';
import { CheckCircleIcon } from 'lucide-react';

export const TaskIcon: React.FC<{ isCompleted: boolean }> = ({
  isCompleted
}) => {
  const { theme } = useTaskTheme();
  return (
    <div
      className={cn(
        'flex items-center justify-center min-w-8 w-10 pl-0.5 h-full group-hover:opacity-50 border-r',
        isCompleted
          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-100 dark:border-r-0'
          : theme.symbol
      )}
    >
      {isCompleted ? (
        <CheckCircleIcon className="h-6 w-6" />
      ) : (
        <theme.icon className="h-6 w-6" />
      )}
    </div>
  );
};
