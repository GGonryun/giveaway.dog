import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { signInAs, toPersonaEmail } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';

const readSession = async (page: Page) =>
  (await (await page.request.get('/api/auth/session')).json())?.user;

const openAccountMenu = async (page: Page, name: string) => {
  await page.getByRole('button', { name }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  return menu;
};

const hostSweepstakesCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Host Sweepstakes' });

const accountRow = (page: Page, label: string): Locator =>
  page
    .getByText(label, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');

const linkProfile = async (
  page: Page,
  label: 'Instagram' | 'Facebook',
  url: string
) => {
  await page.waitForLoadState('networkidle');
  await accountRow(page, label)
    .getByRole('button', { name: 'Connect' })
    .click();
  await page.getByLabel(`${label} Profile URL`).fill(url);
  await accountRow(page, label)
    .getByRole('button', { name: 'Connect' })
    .click();
};

const LINK_TIMEOUT = 20_000;

const expectAccountRow = (page: Page, label: string, text: string) =>
  expect(accountRow(page, label)).toContainText(text, {
    timeout: LINK_TIMEOUT
  });

const displayNameInput = (page: Page) =>
  page.getByPlaceholder('Enter your display name');

const saveDisplayName = (page: Page) =>
  page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Display Name' })
    .getByRole('button', { name: 'Save' })
    .click();

test.use({
  allowedPageErrors: [/ClientFetchError|didn't match the client properties/]
});

test.describe('account menu by role', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test.describe('as a host', () => {
    test.use({ storageState: personaState('host') });

    test('[ACCOUNT-001] a host sees the dashboard and the upgrade', async ({
      page
    }) => {
      await page.goto('/browse');

      const menu = await openAccountMenu(page, 'E2E host');
      await expect(menu).toContainText('E2E host');
      await expect(menu).toContainText(toPersonaEmail('host', RUN_ID));
      for (const name of [
        'Dashboard',
        'Browse Giveaways',
        'Account Settings'
      ]) {
        await expect(menu.getByRole('menuitem', { name })).toBeVisible();
      }
      await expect(
        menu.getByRole('link', { name: 'Upgrade to Pro' })
      ).toBeVisible();
      await expect(
        menu.getByRole('menuitem', { name: 'Participation History' })
      ).toHaveCount(0);

      await menu.getByRole('menuitem', { name: 'Dashboard' }).click();
      await expect(page).toHaveURL(/\/app$/);
    });
  });

  test.describe('as a participant', () => {
    test.use({ storageState: personaState('participant') });

    test('[ACCOUNT-001] a participant sees their participation history', async ({
      page
    }) => {
      await page.goto('/browse');

      const menu = await openAccountMenu(page, 'E2E participant');
      await expect(menu).toContainText('E2E participant');
      await expect(menu).toContainText(toPersonaEmail('participant', RUN_ID));
      await expect(
        menu.getByRole('menuitem', { name: 'Account Settings' })
      ).toBeVisible();
      await expect(
        menu.getByRole('menuitem', { name: 'Dashboard' })
      ).toHaveCount(0);
      await expect(
        menu.getByRole('link', { name: 'Upgrade to Pro' })
      ).toHaveCount(0);

      await menu
        .getByRole('menuitem', { name: 'Participation History' })
        .click();
      await expect(page).toHaveURL(/\/account\/history$/, {
        timeout: LINK_TIMEOUT
      });
    });
  });

  test('[ACCOUNT-001] a visitor sees the login links', async ({ page }) => {
    await page.goto('/browse');

    await expect(
      page.getByRole('link', { name: 'Login', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });
});

test.describe('display name', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-002] a user changes their display name', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('participant');
    const name = `E2E Renamed ${ns}`;
    await page.goto('/account');

    await displayNameInput(page).fill(name);
    await saveDisplayName(page);

    await expect(
      page.getByText('Display name updated successfully')
    ).toBeVisible();
    await page.reload();
    await expect(displayNameInput(page)).toHaveValue(name);
    const menu = await openAccountMenu(page, name);
    await expect(menu).toContainText(name);
  });

  test('[ACCOUNT-003] the account page refuses a display name under 5 characters', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('participant');
    await page.goto('/account');

    await displayNameInput(page).fill('abc');
    await saveDisplayName(page);

    await expect(page.getByText(/at least 5 characters/)).toBeVisible();
    await page.reload();
    await expect(displayNameInput(page)).toHaveValue('E2E participant');
  });

  test('[ACCOUNT-003] the account page refuses a display name over 30 characters', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('participant');
    await page.goto('/account');

    await displayNameInput(page).fill('E2E name that is much too long xx');
    await saveDisplayName(page);

    await expect(page.getByText(/at most 30 characters/)).toBeVisible();
    await page.reload();
    await expect(displayNameInput(page)).toHaveValue('E2E participant');
  });
});

test.describe('host access', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-004] a participant turns on host access', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('participant');
    await page.goto('/account/features');
    await page.waitForLoadState('networkidle');

    const card = hostSweepstakesCard(page);
    await card.getByRole('button', { name: 'Enable Access' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog')).toBeHidden();
    await expect(
      card.getByRole('button', { name: 'Enable Access' })
    ).toBeVisible();

    await card.getByRole('button', { name: 'Enable Access' }).click();
    await page.getByRole('button', { name: 'Enable Host Access' }).click();

    await expect(
      page.getByText('Host access enabled successfully!')
    ).toBeVisible();
    await expect(card.getByRole('button', { name: 'Enabled' })).toBeVisible();
    expect(await readSession(page)).toMatchObject({ accountType: 'HOST' });

    await page.goto('/app');
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText('Choose Your Team')).toBeVisible();
  });

  test('[ACCOUNT-005] a host turns off host access', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('host');
    await page.goto('/account/features');
    await page.waitForLoadState('networkidle');

    const card = hostSweepstakesCard(page);
    await card.getByRole('button', { name: 'Enabled' }).click();

    await expect(
      page.getByText('Host access disabled successfully!')
    ).toBeVisible();
    await expect(
      card.getByRole('button', { name: 'Enable Access' })
    ).toBeVisible();
    expect(await readSession(page)).toMatchObject({
      accountType: 'PARTICIPANT'
    });

    await page.goto('/app');
    await expect(page).toHaveURL(/\/browse$/);
    await page.goto('/account/features');
    await expect(
      hostSweepstakesCard(page).getByRole('button', { name: 'Enable Access' })
    ).toBeVisible();
  });
});

test.describe('connected accounts', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-006] [ACCOUNT-007] a user links and disconnects Instagram and Facebook profiles', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('participant');
    await page.goto('/account');
    await expect(page.getByText(/anonymous account/)).toBeVisible();

    await linkProfile(page, 'Instagram', 'https://instagram.com/p/abc123');
    await expect(
      page.getByText(/Must be a valid Instagram profile URL/)
    ).toBeVisible();
    await page.getByLabel('Instagram Profile URL').fill('');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await linkProfile(page, 'Instagram', `https://instagram.com/e2e_${ns}`);
    await expectAccountRow(page, 'Instagram', `@e2e_${ns}`);
    await expect(page.getByText(/anonymous account/)).toBeHidden();

    await linkProfile(page, 'Facebook', `https://facebook.com/e2e.${ns}`);
    await expectAccountRow(page, 'Facebook', `e2e.${ns}`);

    await page.waitForLoadState('networkidle');
    await accountRow(page, 'Instagram')
      .getByRole('button', { name: 'Disconnect' })
      .click();
    await expect(page.getByText('Account disconnected')).toBeVisible();
    await page.reload();
    await expect(accountRow(page, 'Instagram')).toContainText('Not connected');

    await page.waitForLoadState('networkidle');
    await accountRow(page, 'Facebook')
      .getByRole('button', { name: 'Disconnect' })
      .click();
    await expect(
      page.getByText('Cannot disconnect the only connected account')
    ).toBeVisible();
    await page.reload();
    await expectAccountRow(page, 'Facebook', `e2e.${ns}`);
  });

  test('[ACCOUNT-008] a user cannot disconnect their last account that signs in', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    await seedApi(request).userExtras({
      ns,
      users: [{ persona: 'participant', accounts: [{ identity: 'TWITTER' }] }]
    });
    await signInAs(page.request, 'participant', ns);
    await page.goto('/account');
    await linkProfile(page, 'Instagram', `https://instagram.com/e2e_${ns}`);
    await expectAccountRow(page, 'Instagram', `@e2e_${ns}`);

    await page.waitForLoadState('networkidle');
    await accountRow(page, 'X (Twitter)')
      .getByRole('button', { name: 'Disconnect' })
      .click();
    await expect(
      page.getByRole('region', { name: /Notifications/ }).getByRole('listitem')
    ).toBeVisible();

    await page.reload();
    await expect(accountRow(page, 'X (Twitter)')).not.toContainText(
      'Not connected'
    );
  });

  test(
    '[ACCOUNT-009] a user cannot claim a profile that another user linked',
    knownBug(506),
    async ({ page, freshPersona }) => {
      const first = await freshPersona('participant');
      const url = `https://instagram.com/e2e_${first.ns}`;
      await page.goto('/account');
      await linkProfile(page, 'Instagram', url);
      await expectAccountRow(page, 'Instagram', `@e2e_${first.ns}`);

      await freshPersona('participant2');
      await page.goto('/account');
      await linkProfile(page, 'Instagram', url);

      await expect(page).toHaveURL(/\/account\?error=/);
      await expect(accountRow(page, 'Instagram')).toContainText(
        'Not connected'
      );
      await signInAs(page.request, 'participant', first.ns);
      await page.goto('/account');
      await expectAccountRow(page, 'Instagram', `@e2e_${first.ns}`);
    }
  );

  test(
    '[ACCOUNT-010] the account page says why linking an account failed',
    knownBug(507),
    async ({ page, freshPersona }) => {
      await freshPersona('participant');

      for (const error of [
        'OAuthAccountAlreadyLinked',
        'instagram_link_failed'
      ]) {
        await page.goto(`/account?error=${error}`);
        await expect(
          page.getByRole('alert').filter({ hasText: /link/i })
        ).toBeVisible();
      }
    }
  );
});

test.describe('account deletion', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-011] a user deletes their account', async ({
    page,
    freshPersona
  }) => {
    const { id, ns } = await freshPersona('participant');
    await page.goto('/account/danger-zone');

    await page.getByRole('button', { name: 'Delete Account' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('alertdialog')).toBeHidden();
    await expect(page).toHaveURL(/\/account\/danger-zone$/);

    await page.getByRole('button', { name: 'Delete Account' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Delete Account' })
      .click();

    await expect(page).toHaveURL(/\/$/, { timeout: LINK_TIMEOUT });
    await expect(
      page.getByRole('link', { name: 'Login', exact: true })
    ).toBeVisible();
    expect(await readSession(page)).toBeUndefined();
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);

    const again = await signInAs(page.request, 'participant', ns);
    expect(again.id).not.toBe(id);
  });
});
