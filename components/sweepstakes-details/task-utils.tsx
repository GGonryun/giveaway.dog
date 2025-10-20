import { CompletionStatus, TaskType } from '@prisma/client';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Globe2Icon,
  XCircleIcon
} from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  TASK_CATEGORY,
  TASK_CATEGORY_LABEL,
  TASK_PLATFORM,
  TaskCategorySchema
} from '@/schemas/tasks/schemas';
import { assertNever } from '@/lib/errors';
import { SocialSteamIcon } from '../ui/patterns/steam-icon';
import { SocialXIcon } from '../ui/patterns/x-icon';

export const TaskStatusIcon: React.FC<{ status: CompletionStatus }> = ({
  status
}) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case 'PENDING':
      return <ClockIcon className="h-4 w-4 text-yellow-500" />;
    case 'REJECTED':
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    default:
      return <AlertTriangleIcon className="h-4 w-4 text-gray-500" />;
  }
};

export const TaskStatusBadge: React.FC<{ status: CompletionStatus }> = ({
  status
}) => {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge
          variant="secondary"
          className="text-xs bg-green-100 text-green-800"
        >
          Completed
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge
          variant="outline"
          className="text-xs border-yellow-300 text-yellow-800"
        >
          Pending Review
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="destructive" className="text-xs">
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          Unknown
        </Badge>
      );
  }
};

export const TaskPlatformIcon: React.FC<{ type: TaskType }> = ({ type }) => {
  const platform = TASK_PLATFORM[type];

  switch (platform) {
    case 'website':
      return <Globe2Icon className="h-4 w-4 text-gray-500" />;
    case 'twitter':
      return <SocialXIcon className="h-4 w-4 text-black" />;
    case 'steam':
      return <SocialSteamIcon className="h-4 w-4 text-steam-1" />;
    default:
      throw assertNever(platform);
  }
};

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
