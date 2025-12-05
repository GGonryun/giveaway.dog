import { Alert, AlertDescription } from '@/components/ui/alert';
import { IntegrationSchema } from '../schemas';
import { AlertCircleIcon } from 'lucide-react';
import { assertNever } from '@/lib/errors';

export const IntegrationStatusAlert: React.FC<{
  status: IntegrationSchema['status'];
}> = ({ status }) => {
  switch (status) {
    case 'ERROR':
      return (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>
            This integration is broken. Please disconnect and reconnect to
            resolve the issue.
          </AlertDescription>
        </Alert>
      );
    case 'ACTIVE':
      return null;
    default:
      throw assertNever(status);
  }
};
