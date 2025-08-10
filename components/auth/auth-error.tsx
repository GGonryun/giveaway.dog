import { AlertCircleIcon } from 'lucide-react';

export const parseError = (error: string | null) => {
  if (!error) return 'An unknown error occurred. Please try again.';

  switch (error) {
    case 'OAuthCallbackError':
      return 'There was an error connecting to your account. Please try again.';
    case 'OAuthAccountNotLinked':
      return 'Another account already exists with the same e-mail address. Please use a different login method or contact support.';
    default:
      return error;
  }
};

interface AuthErrorProps {
  error?: string | null;
}

export function AuthError({ error }: AuthErrorProps) {
  if (!error) return null;
  
  return (
    <div
      className="flex items-start gap-2 mt-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <AlertCircleIcon className="min-h-5 min-w-5 h-5 w-5 text-destructive" />
      <p className="text-sm text-destructive">
        {parseError(error)}
      </p>
    </div>
  );
}