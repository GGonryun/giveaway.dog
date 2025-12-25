import { IntegrationSchema } from '../schemas';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const IntegrationStatusBadge: React.FC<{
  status: IntegrationSchema['status'];
}> = ({ status }) => {
  if (status === 'ACTIVE') {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
        <CheckCircle className="h-3 w-3 text-green-600" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100">
      <AlertCircle className="h-3 w-3 text-red-600" strokeWidth={2.5} />
    </div>
  );
};
