import { toAuthErrorDescription } from '@giveaway/auth-model/util';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const LinkResultAlert: React.FC<{
  error?: string | null;
  merged?: boolean;
}> = ({ error, merged }) => {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Could not link your account</AlertTitle>
        <AlertDescription>{toAuthErrorDescription(error)}</AlertDescription>
      </Alert>
    );
  }

  if (merged) {
    return (
      <Alert variant="success">
        <CheckCircle2 />
        <AlertTitle>Accounts merged</AlertTitle>
        <AlertDescription>
          The account you linked had its own profile, so we merged it into
          yours. Its giveaway entries are now on this account.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
