import { Badge } from '@/components/ui/badge';
import { TASK_IS_IMPORT } from '@/lib/task/schemas';
import { TaskType } from '@prisma/client';
import { ImportIcon } from 'lucide-react';

export const ImportBadge: React.FC<{ type: TaskType }> = ({ type }) => {
  const isImport = TASK_IS_IMPORT[type];
  if (!isImport) {
    return null;
  }

  return (
    <Badge variant="secondary" className="px-1.5 text-xs">
      <ImportIcon />
      Import
    </Badge>
  );
};
