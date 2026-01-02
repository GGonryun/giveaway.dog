'use server';

interface TurnstileVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
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
      console.warn('Turnstile verification failed:', data['error-codes']);
    }

    return data;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { success: false, 'error-codes': ['network-error'] };
  }
}
