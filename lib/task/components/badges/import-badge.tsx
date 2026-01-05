import { ImportIcon } from 'lucide-react';
import { SelectTaskBadge } from './select-task-badge';

export const ImportBadge: React.FC = () => {
  return (
    <SelectTaskBadge variant="secondary" Icon={ImportIcon} label="Import" />
  );
};
