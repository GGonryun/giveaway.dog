import { BASE_URL } from '../env';

const DAY_SECONDS = 24 * 60 * 60;

export const userMetricsCookie = () => {
  const url = new URL(BASE_URL);

  return {
    name: 'user_metrics',
    value: encodeURIComponent(
      JSON.stringify({
        userAgent: 'Playwright',
        acceptLanguage: 'en-US',
        timezone: 'UTC',
        screenWidth: 1280,
        screenHeight: 720
      })
    ),
    domain: url.hostname,
    path: '/',
    expires: Math.floor(Date.now() / 1000) + DAY_SECONDS,
    httpOnly: false,
    secure: url.protocol === 'https:',
    sameSite: 'Lax' as const
  };
};
