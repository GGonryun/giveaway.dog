import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';
import { AccountStatus } from '@giveaway/db-model';

export const AccountStatusAlert: React.FC<{
  status: AccountStatus;
  providerLabel: string;
}> = ({ status, providerLabel }) => {
  if (status !== 'ERROR') {
    return null;
  }

  return (
    <Alert variant="destructive" className="text-left">
      <AlertCircleIcon className="h-4 w-4" />
      <AlertDescription>
        Your {providerLabel} connection has expired or been revoked. Please
        reconnect your account to continue.
      </AlertDescription>
    </Alert>
  );
};
