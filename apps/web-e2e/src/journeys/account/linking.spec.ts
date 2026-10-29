import type { Browser, BrowserContext, Page } from '@playwright/test';
import type { E2eDiscordProfile } from '@giveaway/e2e-model/oauth';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { BYPASS_STATE, E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { readParticipants } from '../../helpers/manage';
import { newDiscordId, useMockOAuth } from '../../helpers/oauth';
import { signInAs, toPersonaEmail } from '../../helpers/personas';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { blockThirdParties } from '../../helpers/third-party';

type AccountRows = {
  user: { id: string; email: string; source: string };
  accounts: { provider: string; providerAccountId: string; status: string }[];
};

const SIGN_IN_TIMEOUT = 20_000;

const accountRow = (page: Page, label: string) =>
  page
    .getByText(label, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');

const discordProfile = (ns: string): E2eDiscordProfile => ({
  id: newDiscordId(),
  username: `e2e_${ns}`,
  global_name: 'E2E Imported',
  email: toPersonaEmail('newbie', ns)
});

const newVisitor = async (browser: Browser) => {
  const context = await browser.newContext({ storageState: BYPASS_STATE });
  await blockThirdParties(context);
  return context;
};

const signInWithDiscord = async (context: BrowserContext) => {
  const page = await context.newPage();
  await page.goto('/login');
  await page.getByRole('button', { name: 'Login with Discord' }).click();
  await expect(page).not.toHaveURL(/\/(login|api\/)/, {
    timeout: SIGN_IN_TIMEOUT
  });
  return page;
};

const markImported = (page: Page, ns: string) =>
  seedApi(page.request).userExtras({
    ns,
    users: [{ persona: 'newbie', source: 'DISCORD_IMPORT' }]
  });

const readAccounts = (page: Page, ns: string) =>
  seedApi(page.request).rows<AccountRows>({
    view: 'accounts',
    persona: 'newbie',
    ns
  });

test.describe('account linking', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to use the mock OAuth provider');

  test('[ACCOUNT-016] the account page says that an account was merged', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('participant');

    await page.goto('/account?merged=true');

    await expect(
      page.getByRole('alert').filter({ hasText: /merged/i })
    ).toBeVisible();
  });

  test('[ACCOUNT-024] a user who links the account of an imported user gets its entries', async ({
    browser,
    context,
    page,
    request,
    freshPersona
  }, testInfo) => {
    const importedNs = freshNamespace(testInfo.workerIndex);
    const profile = discordProfile(importedNs);
    const importer = await newVisitor(browser);
    await useMockOAuth(importer, 'discord', profile);
    await signInWithDiscord(importer);
    await importer.close();
    const imported = await readAccounts(page, importedNs);
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      entries: [{ persona: 'newbie', ns: importedNs }]
    });
    await markImported(page, importedNs);
    const { id } = await freshPersona('participant');

    await useMockOAuth(context, 'discord', profile);
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
    await accountRow(page, 'Discord')
      .getByRole('button', { name: 'Connect' })
      .click();

    await expect(page).toHaveURL(/\/account\?merged=true$/, {
      timeout: SIGN_IN_TIMEOUT
    });
    await expect(accountRow(page, 'Discord')).not.toContainText(
      'Not connected'
    );
    const participants = await readParticipants(request, giveaway.id);
    expect(participants.map((participant) => participant.userId)).toEqual([id]);
    const lookup = await request.get(
      `/api/e2e/rows?${new URLSearchParams({
        view: 'accounts',
        persona: 'newbie',
        ns: importedNs
      })}`,
      { headers: { 'x-e2e-secret': E2E_SECRET } }
    );
    expect(lookup.status()).toBe(404);
    expect(imported.user.id).not.toBe(id);
  });

  test('[ACCOUNT-025] a visitor who signs in with the account of an imported user takes it over', async ({
    browser,
    page
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const profile = discordProfile(ns);
    const importer = await newVisitor(browser);
    await useMockOAuth(importer, 'discord', profile);
    await signInWithDiscord(importer);
    await importer.close();
    const imported = await readAccounts(page, ns);
    await markImported(page, ns);

    const visitor = await newVisitor(browser);
    await useMockOAuth(visitor, 'discord', profile);
    const visitorPage = await signInWithDiscord(visitor);

    await expect(visitorPage).toHaveURL(/\/onboarding/, {
      timeout: SIGN_IN_TIMEOUT
    });
    const session = await visitorPage.request.get('/api/auth/session');
    expect((await session.json()).user.id).toBe(imported.user.id);
    expect((await readAccounts(page, ns)).user).toMatchObject({
      id: imported.user.id,
      source: 'SIGNUP'
    });
    await visitor.close();
  });
});

test.describe('expired connections', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-017] the account page offers to reconnect an expired connection', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    await seedApi(request).userExtras({
      ns,
      users: [
        {
          persona: 'participant',
          accounts: [{ identity: 'DISCORD', status: 'ERROR' }]
        }
      ]
    });
    await signInAs(page.request, 'participant', ns);

    await page.goto('/account');

    const row = accountRow(page, 'Discord');
    await expect(row).toContainText(
      'Your Discord connection has expired or been revoked'
    );
    await expect(row.getByRole('button', { name: 'Reconnect' })).toBeVisible();
  });

  test('[ACCOUNT-017] the account page offers to reconnect a connection that is missing permissions', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    await seedApi(request).userExtras({
      ns,
      users: [
        {
          persona: 'participant',
          accounts: [{ identity: 'DISCORD', scopes: [] }]
        }
      ]
    });
    await signInAs(page.request, 'participant', ns);

    await page.goto('/account');

    const row = accountRow(page, 'Discord');
    await expect(row).toContainText('Missing Permissions');
    await expect(row.getByRole('button', { name: 'Reconnect' })).toBeVisible();
  });

  test.fixme('[ACCOUNT-018] signing in again with Discord clears an expired connection (#569)', async () => {});
});
