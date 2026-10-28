import { randomInt } from 'crypto';
import type { BrowserContext, Page } from '@playwright/test';
import {
  E2E_OAUTH_SECRET_COOKIE,
  type E2eOAuthProfiles,
  type E2eOAuthProvider,
  toE2eOAuthProfileCookie,
  toE2eOAuthProfileCookieValue
} from '@giveaway/e2e-model/oauth';
import { BASE_URL, E2E_SECRET } from '../env';

export const newDiscordId = () => `${Date.now()}${randomInt(100000, 1000000)}`;

export const useMockOAuth = async <P extends E2eOAuthProvider>(
  context: BrowserContext,
  provider: P,
  profile: E2eOAuthProfiles[P]
) => {
  const cookie = {
    url: BASE_URL,
    httpOnly: true,
    sameSite: 'Lax' as const
  };
  await context.addCookies([
    { ...cookie, name: E2E_OAUTH_SECRET_COOKIE, value: E2E_SECRET },
    {
      ...cookie,
      name: toE2eOAuthProfileCookie(provider),
      value: toE2eOAuthProfileCookieValue(profile)
    }
  ]);
};

export const clickTikTokLogin = async (page: Page) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'More ways to sign in' }).click();
  await page.getByRole('button', { name: 'Login with TikTok' }).click();
};
