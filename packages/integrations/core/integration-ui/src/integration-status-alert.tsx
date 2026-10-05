import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { IntegrationSchema } from '@giveaway/integration-model/schemas';
import { AlertCircleIcon } from 'lucide-react';
import { assertNever } from '@giveaway/util-errors';

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
    case 'PENDING':
      return (
        <Alert variant="warning">
          <AlertCircleIcon />
          <AlertDescription>
            Please complete the setup to activate the integration.
          </AlertDescription>
        </Alert>
      );
    case 'ACTIVE':
      return null;

    default:
      throw assertNever(status);
  }
};
