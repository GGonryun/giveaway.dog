import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { noRedirect } from '../../helpers/http';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';
import { seedRolesTeam } from '../../helpers/teams';

const TWITCH_SCOPE =
  'openid user:read:email moderation:read channel:read:redemptions';

const integrationsPath = (slug: string) => `/app/${slug}/settings/integrations`;

const card = (page: Page, title: 'Bluesky' | 'Discord' | 'Twitch') =>
  page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText(title, { exact: true }) });

const disconnect = async (page: Page, title: 'Bluesky' | 'Discord') => {
  await card(page, title).getByRole('button', { name: 'Disconnect' }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: /^Disconnect/ })
    .click();
  await expect(
    page.getByText(`${title} disconnected successfully`)
  ).toBeVisible();
};

const seedOwnTeam = async (page: Page, ns: string, suffix: string) => {
  const { team } = await seedApi(page.request).team({
    ns,
    suffix,
    name: `Team ${suffix}`
  });
  await signInAs(page.request, 'host', ns);
  return team;
};

test.describe('team integrations', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({
    allowedPageErrors: [/didn't match the client properties|ClientFetchError/]
  });

  test('a member starts a Discord install, and an unfinished install cannot be verified', async ({
    page
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(page.request, ns);
    await signInAs(page.request, 'member', ns);
    await page.goto(integrationsPath(team.slug));

    await card(page, 'Discord')
      .getByRole('button', { name: 'Install Bot' })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Complete Discord Installation'
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Verify Installation' }).click();
    await expect(
      page.getByText(
        'Integration is not active. Are you sure you completed the installation?'
      )
    ).toBeVisible();

    await page.reload();
    const discord = card(page, 'Discord');
    await expect(
      discord.getByText(
        'Please complete the setup to activate the integration.'
      )
    ).toBeVisible();
    await discord.getByRole('button', { name: 'Continue' }).click();
    await dialog.getByRole('button', { name: 'Disconnect' }).click();
    await expect(
      page.getByText('Discord disconnected successfully')
    ).toBeVisible();

    await page.reload();
    await expect(
      card(page, 'Discord').getByRole('button', { name: 'Install Bot' })
    ).toBeVisible();
  });

  test('an owner disconnects the Discord and Bluesky integrations', async ({
    page
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const team = await seedOwnTeam(page, ns, 'dis');
    await seedApi(page.request).integrations({
      team: team.slug,
      integrations: [{ provider: 'DISCORD' }, { provider: 'BLUESKY' }]
    });
    await page.goto(integrationsPath(team.slug));

    await disconnect(page, 'Discord');
    await disconnect(page, 'Bluesky');

    await page.reload();
    await expect(
      card(page, 'Discord').getByRole('button', { name: 'Install Bot' })
    ).toBeVisible();
    await expect(
      card(page, 'Bluesky').getByRole('button', { name: 'Connect' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Disconnect' })).toHaveCount(
      0
    );
  });

  test('Twitch connect sends the owner to Twitch with the state of the team, and a cancelled authorization shows an error', async ({
    page
  }, testInfo) => {
    const health = await seedApi(page.request).health();
    test.skip(
      !health?.twitchOAuth,
      'Set TWITCH_CLIENT_ID on the deployment to connect Twitch'
    );
    const ns = freshNamespace(testInfo.workerIndex);
    const team = await seedOwnTeam(page, ns, 'tw');
    await page.route('https://id.twitch.tv/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '' })
    );
    await page.goto(integrationsPath(team.slug));

    await card(page, 'Twitch')
      .getByRole('button', { name: 'Install Bot' })
      .click();
    const authorize = page.waitForRequest(
      (request) => new URL(request.url()).hostname === 'id.twitch.tv'
    );
    await page
      .getByRole('dialog', { name: 'Connect Twitch Channel' })
      .getByRole('button', { name: 'Connect with Twitch' })
      .click();

    const url = new URL((await authorize).url());
    expect(url.pathname).toBe('/oauth2/authorize');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBeTruthy();
    expect(url.searchParams.get('redirect_uri')).toMatch(
      /\/api\/twitch\/callback$/
    );
    expect(url.searchParams.get('scope')).toBe(TWITCH_SCOPE);
    const state = url.searchParams.get('state') ?? '';
    expect(state).toMatch(new RegExp(`^${team.slug}:\\w+$`));

    const callback = `/api/twitch/callback?${new URLSearchParams({ error: 'access_denied', state })}`;
    await page.goto(callback);
    await expect(page).toHaveURL(
      `${integrationsPath(team.slug)}?error=access_denied`
    );
    await expect(page.locator('[data-slot="alert"]')).toBeVisible();

    await page.goto(callback);
    await expect(page).toHaveURL(
      `${integrationsPath(team.slug)}?error=internal_server_error`
    );

    const missingState = await page.request.get(
      '/api/twitch/callback',
      noRedirect
    );
    expect(missingState.status()).toBe(307);
    expect(new URL(missingState.headers().location).pathname).toBe('/404');

    await page.goto(integrationsPath(team.slug));
    await expect(
      card(page, 'Twitch').getByRole('button', { name: 'Install Bot' })
    ).toBeVisible();
  });
});
