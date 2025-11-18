import { Badge } from '@/components/ui/badge';
import { CompletionStatus } from '@prisma/client';

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
