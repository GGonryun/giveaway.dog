'use client';

import React from 'react';
import { TurnstileWidget } from './widget';
import { useTurnstile } from './use-turnstile';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';

interface TurnstileGateProps {
  sweepstakesId?: string;
  children: React.ReactNode;
  enabled?: boolean;
}

export function TurnstileGate({ children }: TurnstileGateProps) {
  const { isPreview, sweepstakes } = useGiveawayParticipation();

  const { isVerified, needsVerification, verify } = useTurnstile();
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  const handleTurnstileVerify = async (token: string) => {
    await verify(token, sweepstakes.id);
  };

  if (!isPreview && siteKey && needsVerification && !isVerified) {
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
