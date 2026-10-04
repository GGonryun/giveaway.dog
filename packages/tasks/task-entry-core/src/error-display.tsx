import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';

export const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <Alert variant="destructive" className="text-left">
    <AlertCircleIcon />
    <AlertTitle>Verification Failed</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);
