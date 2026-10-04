import { CompletionStatus } from '@giveaway/db-model';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from 'lucide-react';

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
