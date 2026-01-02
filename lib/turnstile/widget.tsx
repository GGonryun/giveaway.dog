'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

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
      key={'enter_giveaway'}
      siteKey={siteKey}
      onSuccess={handleSuccess}
      onError={handleError}
      options={{
        retryInterval: 30e3,
        appearance: 'always',
        size: 'normal'
      }}
    />
  );
}
