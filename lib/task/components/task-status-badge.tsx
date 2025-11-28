import { Badge } from '@/components/ui/badge';
import { CompletionStatus } from '@prisma/client';

export const TaskStatusBadge: React.FC<{ status: CompletionStatus }> = ({
  status
}) => {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pending Review</Badge>;
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
