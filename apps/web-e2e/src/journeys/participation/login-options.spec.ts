import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BONUS = 'Claim a free entry';
const CONNECT = 'Connect to participate...';

const PROVIDER_OPTION =
  /^(X \(Twitter\)|Bluesky|Anonymous|Google|Discord|YouTube|Email|Twitch|Steam|Kick|Instagram|Facebook|TikTok|Velora|LinkedIn)$/;

const providerOptions = (page: Page) =>
  page.getByRole('button', { name: PROVIDER_OPTION });

test.describe('the login options of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a visitor sees only the identities that the host allowed', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: {
        allowedIdentities: ['DISCORD', 'EMAIL'],
        requirePreEntryLogin: true,
        formFields: []
      },
      tasks: [{ type: 'BONUS_TASK', title: BONUS }]
    });

    await page.goto(`/browse/${giveaway.id}`);

    await expect(page.getByText(CONNECT)).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(providerOptions(page)).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Discord' })).toBeVisible();

    await page.getByRole('button', { name: 'Email' }).click();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Send Login Link' })
    ).toBeVisible();
  });

  test('a visitor sees the login options inside a task and a prize', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      tasks: [{ type: 'BONUS_TASK', title: BONUS, value: 3 }],
      prizes: [{ name: 'Golden ticket' }]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText(CONNECT)).toBeHidden();
    await expect(page.getByText('+3', { exact: true })).toBeVisible();

    await page.getByRole('heading', { name: BONUS }).click();
    await expect(page.getByText(CONNECT)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeHidden();
    await page.getByRole('heading', { name: BONUS }).click();
    await expect(page.getByText(CONNECT)).toBeHidden();

    await page.getByRole('tab', { name: 'Prizes' }).click();
    await page.getByRole('heading', { name: 'Golden ticket' }).click();
    await expect(page.getByText(CONNECT)).toBeVisible();
  });

  test('a participant without an allowed identity sees the login options inside a task', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    const { ns } = await freshPersona('participant');
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
      ]
    });
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: { allowedIdentities: ['DISCORD'], formFields: [] },
      tasks: [{ type: 'BONUS_TASK', title: BONUS }]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText('Signed in as')).toBeVisible();
    await page.getByRole('heading', { name: BONUS }).click();

    await expect(page.getByText(CONNECT)).toBeVisible();
    await expect(providerOptions(page)).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Discord' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeHidden();
  });
});
