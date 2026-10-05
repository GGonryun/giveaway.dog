import pluralize from 'pluralize';
import React from 'react';
import { SelectTaskBadge } from './select-task-badge';
import { BanIcon } from 'lucide-react';

export const ErrorCountBadge: React.FC<{ numErrors: number }> = ({
  numErrors
}) => {
  return (
    <SelectTaskBadge
      variant="destructive"
      Icon={BanIcon}
      label={`${numErrors} ${pluralize('error', numErrors)}`}
    />
  );
};
