import {
  TASK_CATEGORY,
  TaskCategorySchema,
  TASK_CATEGORY_LABEL,
  TaskType
} from '@/lib/task/schemas';
import { Badge } from '@/components/ui/badge';

export const TaskCategoryBadge: React.FC<{ type: TaskType }> = ({ type }) => {
  const category = TASK_CATEGORY[type];

  const categoryStyles: Record<TaskCategorySchema, string> = {
    social: 'bg-blue-100 text-blue-800',
    community: 'bg-purple-100 text-purple-800',
    engagement: 'bg-green-100 text-green-800'
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs ${categoryStyles[category] || 'bg-gray-100 text-gray-800'}`}
    >
      {TASK_CATEGORY_LABEL[category]}
    </Badge>
  );
};
