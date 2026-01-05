import { BanIcon } from 'lucide-react';
import { SelectTaskBadge } from './select-task-badge';

export const MaxOfOneBadge = () => {
  return (
    <SelectTaskBadge variant="destructive" Icon={BanIcon} label="Max of 1" />
  );
};
