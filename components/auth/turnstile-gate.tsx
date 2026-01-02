'use client';

import React, { useState } from 'react';
import { TurnstileWidget } from './turnstile-widget';

interface TurnstileGateProps {
  onVerify: (token: string) => Promise<{ success: boolean }>;
  children: React.ReactNode;
  enabled?: boolean;
}

export function TurnstileGate({
  onVerify,
  children,
  enabled = true
}: TurnstileGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  const handleTurnstileVerify = async (token: string) => {
    const result = await onVerify(token);
    if (result && result.success) {
      setIsVerified(true);
    }
  };

  if (enabled && siteKey && !isVerified) {
    return (
      <div className="flex flex-col items-center justify-center pt-2 pb-4 space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Security Verification</h3>
          <p className="text-sm text-muted-foreground">
            Please complete the verification to continue
          </p>
        </div>
        <TurnstileWidget siteKey={siteKey} onVerify={handleTurnstileVerify} />
      </div>
    );
  }

  return <>{children}</>;
}
