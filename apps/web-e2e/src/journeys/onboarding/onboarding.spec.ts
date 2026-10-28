import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE, E2E_SECRET, RUN_ID } from '../../env';
import { STUB_BLOB_URL, stubBlobUploads } from '../../helpers/blob';
import { knownBug } from '../../helpers/known-bug';
import { expectAfterReloads } from '../../helpers/poll';
import {
  captureServerAction,
  readActionResult,
  replayServerAction,
  rewriteServerActions
} from '../../helpers/rsc';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { blockThirdParties } from '../../helpers/third-party';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const openProfileStep = async (page: Page, username: string) => {
  await page.goto('/onboarding');
  await expect(page.getByText('Welcome to Giveaway.dog')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Username').fill(username);
};

const completeSetup = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Complete Setup' }).click();
};

const toUsername = (ns: string) => `e2e_${ns}`;

const readSession = async (page: Page) =>
  (await (await page.request.get('/api/auth/session')).json()).user;

const openAccountMenu = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).click();
  return page.getByRole('menu');
};

test.describe('onboarding', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('a newbie finishes onboarding with a profile picture', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('newbie');
    const uploads = await stubBlobUploads(page);
    await openProfileStep(page, `e2e_${ns}`);

    const chooser = page.waitForEvent('filechooser');
    await page.getByText('Drag and drop files here').click();
    await (
      await chooser
    ).setFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });

    await expect(page.getByRole('img', { name: 'Preview' })).toBeVisible();
    await expect(page.getByText('Uploading...')).toBeHidden();
    expect(uploads).toEqual([{ pathname: 'avatar.png', url: STUB_BLOB_URL }]);

    await completeSetup(page);

    await expect(page).toHaveURL(/\/browse$/);
    await page.goto('/account');
    await expectAfterReloads(page, () =>
      expect(page.getByRole('img', { name: 'Preview' })).toHaveAttribute(
        'src',
        STUB_BLOB_URL
      )
    );
  });

  test('the server refuses a username that the form refuses', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('newbie');
    await openProfileStep(page, 'valid_name');
    const { responses } = await rewriteServerActions(page, ([input]) => [
      { ...(input as object), username: 'x' }
    ]);

    await completeSetup(page);

    await expect.poll(() => responses.length).toBe(1);
    expect(readActionResult(responses[0])).toMatchObject({
      ok: false,
      data: { code: 'UNPROCESSABLE_CONTENT' }
    });
    await page.goto('/browse');
    await expect(page).toHaveURL(/\/onboarding$/);
  });
});

test.describe('onboarding replay', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ allowedPageErrors: ['net::ERR_FAILED'] });

  test('a visitor cannot replay the onboarding of a newbie', async ({
    browser,
    page,
    freshPersona
  }) => {
    await freshPersona('newbie');
    await openProfileStep(page, 'valid_name');
    const action = await captureServerAction(page, () => completeSetup(page), {
      abort: true
    });

    const visitor = await browser.newContext({ storageState: BYPASS_STATE });
    await blockThirdParties(visitor);
    const visitorPage = await visitor.newPage();
    await visitorPage.goto('/');

    const response = await replayServerAction(visitorPage, action);

    expect(readActionResult(response)).toMatchObject({
      ok: false,
      data: { code: 'UNAUTHORIZED' }
    });
    await visitor.close();
  });
});

test.describe('onboarding journeys', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ allowedPageErrors: [/ClientFetchError/] });

  test('[ONBOARD-001] a newbie finishes onboarding as a participant', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('newbie');
    await page.goto('/browse');
    await expect(page).toHaveURL(/\/onboarding$/);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/onboarding\?step=2$/);
    await expect(page.getByText('Complete Your Profile')).toBeVisible();
    const username = page.getByLabel('Username');
    await username.pressSequentially(`E2E_${ns.toUpperCase()}!`);
    await expect(username).toHaveValue(toUsername(ns));
    await expect(
      page.getByRole('button', { name: 'Complete Setup' })
    ).toBeEnabled();
    await completeSetup(page);

    await expect(page.getByText('Welcome to Giveaway.dog!')).toBeVisible({
      timeout: 15_000
    });
    await expect(page).toHaveURL(/\/browse$/);
    await page.reload();
    await expect(page).toHaveURL(/\/browse$/);
    expect(await readSession(page)).toMatchObject({
      onboarded: true,
      accountType: 'PARTICIPANT',
      username: toUsername(ns)
    });

    const menu = await openAccountMenu(page, 'E2E newbie');
    await expect(
      menu.getByRole('menuitem', { name: 'Participation History' })
    ).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Dashboard' })).toHaveCount(
      0
    );
    await page.keyboard.press('Escape');

    await page.goto('/app');
    await expect(page).toHaveURL(/\/browse$/);

    await page.goto('/account');
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  test('[ONBOARD-002] a newbie finishes onboarding as a host', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('newbie');
    await page.goto('/onboarding');
    await page.getByText('Host Giveaways').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Username').fill(toUsername(ns));
    await completeSetup(page);

    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText('Choose Your Team')).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText('Choose Your Team')).toBeVisible();
    expect(await readSession(page)).toMatchObject({
      onboarded: true,
      accountType: 'HOST',
      username: toUsername(ns)
    });

    await page.goto('/account/features');
    await expect(
      page
        .locator('[data-slot="card"]')
        .filter({ hasText: 'Host Sweepstakes' })
        .getByRole('button', { name: 'Enabled' })
    ).toBeVisible();

    const menu = await openAccountMenu(page, 'E2E newbie');
    await expect(
      menu.getByRole('menuitem', { name: 'Dashboard' })
    ).toBeVisible();
  });

  test('[ONBOARD-003] a newbie cannot take a username that is taken', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('newbie');
    await openProfileStep(page, toUsername(ns));
    await completeSetup(page);
    await expect(page).toHaveURL(/\/browse$/);

    const second = await freshPersona('newbie');
    await openProfileStep(page, toUsername(ns));
    await completeSetup(page);

    await expect(page.getByText('Username is already taken')).toHaveCount(2);
    await expect(page).toHaveURL(/\/onboarding\?step=2$/);

    await page.getByLabel('Username').fill(toUsername(second.ns));
    await completeSetup(page);
    await expect(page).toHaveURL(/\/browse$/);
  });

  test('[ONBOARD-004] a newbie returns to the giveaway after onboarding', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug
    });
    const { ns } = await freshPersona('newbie');

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Username').fill(toUsername(ns));
    await completeSetup(page);

    await expect(page).toHaveURL(new RegExp(`/browse/${giveaway.id}$`));
  });

  test('[ONBOARD-005] a newbie who picks hosting and reloads the profile step finishes as a host', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('newbie');
    await page.goto('/onboarding');
    await page.getByText('Host Giveaways').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/onboarding\?step=2&accountType=HOST$/);

    await page.reload();
    await page.getByLabel('Username').fill(toUsername(ns));
    await completeSetup(page);

    await expect(page).toHaveURL(/\/app$/);
    expect(await readSession(page)).toMatchObject({
      onboarded: true,
      accountType: 'HOST'
    });
  });

  test('[ONBOARD-006] an onboarded host who opens the onboarding page stays a host', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('host');

    await page.goto('/onboarding');

    await expect(page).toHaveURL(/\/app$/);
    expect(await readSession(page)).toMatchObject({
      onboarded: true,
      accountType: 'HOST'
    });
  });
});
