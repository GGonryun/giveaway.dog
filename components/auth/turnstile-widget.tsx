'use client';

import { useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => Promise<void>;
}

export function TurnstileWidget({ siteKey, onVerify }: TurnstileWidgetProps) {
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
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        options={{
          theme: 'light',
          size: 'normal'
        }}
      />
    </div>
  );
}
