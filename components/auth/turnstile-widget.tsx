'use client';

import { useEffect, useRef, useState } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => Promise<void>;
  autoExecute?: boolean;
}

export function TurnstileWidget({
  siteKey,
  onVerify,
  autoExecute = true
}: TurnstileWidgetProps) {
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  useEffect(() => {
    if (autoExecute && turnstileRef.current) {
      turnstileRef.current.execute();
    }
  }, [autoExecute, turnstileRef]);

  const handleSuccess = (token: string) => {
    onVerify(token).catch((error) => {
      console.error('Verification failed:', error);
    });
  };

  const handleError = (errorCode: string) => {
    console.error('Turnstile error:', errorCode);
    onVerify('failed').catch((error) => {
      console.error('Failed verification handling error:', error);
    });
  };

  return (
    <div className="flex justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        options={{
          theme: 'light',
          size: 'invisible',
          execution: 'execute'
        }}
      />
    </div>
  );
}
