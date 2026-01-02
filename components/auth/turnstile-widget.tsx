'use client';

import { useRef } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => Promise<void>;
}

export function TurnstileWidget({ siteKey, onVerify }: TurnstileWidgetProps) {
  const turnstileRef = useRef<TurnstileInstance | null>(null);

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

  const handleLoad = () => {
    if (turnstileRef.current) {
      turnstileRef.current.execute();
    }
  };

  return (
    <div className="flex justify-center">
      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleSuccess}
        onError={handleError}
        onLoad={handleLoad}
        options={{
          theme: 'light',
          size: 'normal'
        }}
      />
    </div>
  );
}
