'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { toast } from 'sonner';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => Promise<void>;
}

export function TurnstileWidget({ siteKey, onVerify }: TurnstileWidgetProps) {
  const handleSuccess = (token: string) => {
    onVerify(token).catch(handleError);
  };

  const handleError = (error: string) => {
    console.error('Verification failed:', error);
    toast.error('Verification failed. Please refresh the page to try again.');
  };

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={handleSuccess}
      onError={handleError}
      options={{
        action: 'enter_giveaway',
        retryInterval: 30e3,
        appearance: 'always',
        size: 'normal'
      }}
    />
  );
}
