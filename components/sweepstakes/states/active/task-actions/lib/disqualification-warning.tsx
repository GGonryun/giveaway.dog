import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';

export const DisqualificationWarning: React.FC = () => (
  <Alert variant="error" className="text-left">
    <AlertCircleIcon />
    <AlertTitle>Important</AlertTitle>
    <AlertDescription>
      If you do not complete the task after clicking the button, you may be
      disqualified from this and all future giveaways.
    </AlertDescription>
  </Alert>
);
