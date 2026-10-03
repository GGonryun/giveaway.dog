'use server';

import { cookies } from 'next/headers';
import { TURNSTILE_COOKIE_NAME } from '@giveaway/turnstile-model/consts';

export interface TurnstileVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
  confidence?: number;
  metadata?: {
    interactive?: boolean;
  };
}

export async function checkTurnstileVerification(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(TURNSTILE_COOKIE_NAME);

  return !!cookie?.value;
}

export async function verifyTurnstileToken(
  token: string
): Promise<TurnstileVerificationResponse> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment && token.includes('DUMMY.TOKEN')) {
    return { success: true };
  }

  if (!secretKey) {
    console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY not configured');
    return { success: false, 'error-codes': ['secret-missing'] };
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token
        })
      }
    );

    const data: TurnstileVerificationResponse = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      const expectedErrors = ['timeout-or-duplicate'];
      const hasOnlyExpectedErrors = errorCodes.every((code) =>
        expectedErrors.includes(code)
      );

      // Only log unexpected errors as warnings
      if (!hasOnlyExpectedErrors) {
        console.warn('Turnstile verification failed:', errorCodes);
      }
    } else {
      // If metadata.interactive is false, the user passed without interaction
      // Set confidence to maximum (1.0) as this indicates high trust
      if (data.metadata?.interactive === false) {
        data.confidence = 1.0;
      }
    }

    return data;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, 'error-codes': ['network-error'] };
  }
}
