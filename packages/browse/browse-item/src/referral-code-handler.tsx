'use client';

import { setReferralCodeCookie } from '@giveaway/referrals-model/cookies';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function ReferralCodeHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCodeCookie(ref);
    }
  }, [searchParams]);

  return null;
}
