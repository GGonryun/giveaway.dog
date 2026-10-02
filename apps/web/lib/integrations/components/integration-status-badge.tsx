import { assertNever } from '@giveaway/util-errors';
import { IntegrationSchema } from '../schemas';
import { CheckCircle, AlertCircle, LoaderCircle } from 'lucide-react';

export const IntegrationStatusBadge: React.FC<{
  status: IntegrationSchema['status'];
}> = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100">
          <LoaderCircle
            className="h-3 w-3 text-yellow-600 animate-spin"
            strokeWidth={2.5}
          />
        </div>
      );
    case 'ACTIVE':
      return (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
          <CheckCircle className="h-3 w-3 text-green-600" strokeWidth={2.5} />
        </div>
      );
    case 'ERROR':
      return (
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
          <AlertCircle className="h-3 w-3 text-red-600" strokeWidth={2.5} />
        </div>
      );
    default:
      throw assertNever(status);
  }
};
