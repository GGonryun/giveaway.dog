import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { APP_URL, BASE_URL } from '../../env';

type OAuthStart = {
  button: string;
  id: string;
  hosts: string[];
  clientParam: string;
  more?: boolean;
};

const OAUTH_STARTS: OAuthStart[] = [
  {
    button: 'X (Twitter)',
    id: 'twitter',
    hosts: ['x.com', 'twitter.com'],
    clientParam: 'client_id'
  },
  {
    button: 'Google',
    id: 'google',
    hosts: ['accounts.google.com'],
    clientParam: 'client_id'
  },
  {
    button: 'Discord',
    id: 'discord',
    hosts: ['discord.com'],
    clientParam: 'client_id'
  },
  {
    button: 'Twitch',
    id: 'twitch',
    hosts: ['id.twitch.tv'],
    clientParam: 'client_id',
    more: true
  },
  {
    button: 'Kick',
    id: 'kick',
    hosts: ['id.kick.com'],
    clientParam: 'client_id',
    more: true
  },
  {
    button: 'TikTok',
    id: 'tiktok',
    hosts: ['www.tiktok.com'],
    clientParam: 'client_key',
    more: true
  },
  {
    button: 'Velora',
    id: 'velora',
    hosts: ['velora.tv'],
    clientParam: 'client_id',
    more: true
  },
  {
    button: 'LinkedIn',
    id: 'linkedin',
    hosts: ['www.linkedin.com'],
    clientParam: 'client_id',
    more: true
  }
];

const ORIGINS = [...new Set([BASE_URL, APP_URL])].map(
  (url) => new URL(url).origin
);

const stubProviderPages = async (page: Page) => {
  await page.route(
    (url) => !ORIGINS.includes(url.origin),
    async (route) => {
      if (!route.request().isNavigationRequest()) return route.fallback();
      await route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Provider</title><p>Provider</p>'
      });
    }
  );
};

const startSignIn = async (page: Page, button: string, more = false) => {
  await stubProviderPages(page);
  await page.goto('/login');
  if (more) {
    await page.getByRole('button', { name: 'More ways to sign in' }).click();
  }
  await page.getByRole('button', { name: `Login with ${button}` }).click();
  await page.waitForURL((url) => !ORIGINS.includes(url.origin), {
    timeout: 15_000
  });
  return new URL(page.url());
};

const UNSET = ['', 'undefined', 'null'];

test.describe('the OAuth login buttons', () => {
  for (const { button, id, hosts, clientParam, more } of OAUTH_STARTS) {
    test(`[AUTH-017] the ${button} button starts a sign-in at ${hosts[0]} with a callback on this deployment`, async ({
      page
    }) => {
      const url = await startSignIn(page, button, more);

      expect(hosts).toContain(url.hostname);
      expect(
        ORIGINS.map((origin) => `${origin}/api/auth/callback/${id}`)
      ).toContain(url.searchParams.get('redirect_uri'));
      expect(url.searchParams.has(clientParam)).toBe(true);

      if (UNSET.includes(url.searchParams.get(clientParam)!)) {
        test.info().annotations.push({
          type: 'warning',
          description: `This deployment has no ${button} client id, so a real ${button} sign-in cannot finish here`
        });
      }
    });
  }

  test('[AUTH-017] the Steam button starts a sign-in at steamcommunity.com and returns to this deployment', async ({
    page
  }) => {
    const url = await startSignIn(page, 'Steam');
    const app = new URL(APP_URL).origin;

    expect(url.hostname).toBe('steamcommunity.com');
    expect(url.searchParams.get('openid.return_to')).toBe(
      `${app}/api/auth/steam-callback`
    );
    expect(url.searchParams.get('openid.realm')).toBe(app);
  });
});
