import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { signInAs, toPersonaEmail } from '../../helpers/personas';
import { seedWorkerTeam } from '../../helpers/seed';

const SESSION_COOKIE = /^(__Secure-)?authjs\.session-token(\.\d+)?$/;

const expectLoggedOut = async (page: Page) => {
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
  await expect(
    page.locator('header').getByRole('link', { name: 'Login' })
  ).toBeVisible();

  const session = await page.request.get('/api/auth/session');
  expect(await session.json()).toBeNull();

  const cookies = await page.context().cookies();
  expect(
    cookies
      .filter(({ name }) => SESSION_COOKIE.test(name))
      .map(({ name }) => name)
  ).toEqual([]);

  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
};

test.describe('logout', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test.describe('as a participant', () => {
    test.use({ storageState: personaState('participant') });

    test.beforeEach(async ({ page }) => {
      await signInAs(page.request, 'participant');
    });

    test('[AUTH-008] logs out from the avatar menu', async ({ page }) => {
      await page.goto('/browse');

      await page.getByRole('button', { name: 'E2E participant' }).click();
      await page.getByRole('menuitem', { name: /Logout/ }).click();

      await expectLoggedOut(page);
    });

    test('[AUTH-008] logs out from the account page', async ({ page }) => {
      await page.goto('/account');

      await page.getByRole('button', { name: 'Logout', exact: true }).click();

      await expectLoggedOut(page);
    });

    test('[AUTH-008] logs out from the logout page', async ({ page }) => {
      await page.goto('/logout');

      await expect(
        page.getByRole('heading', { name: 'Logging you out' })
      ).toBeVisible();
      await expect(page.getByRole('progressbar')).toBeVisible();

      await expectLoggedOut(page);
    });

    test(
      '[AUTH-009] the logout page counts down from 5 seconds',
      knownBug(432),
      async ({ page }) => {
        await page.goto('/logout');

        await expect(page.getByText(/Redirecting in \d+s/)).toHaveText(
          'Redirecting in 5s',
          { timeout: 1_000 }
        );
      }
    );
  });

  test.describe('as a host', () => {
    test.use({ storageState: personaState('host') });

    test.beforeEach(async ({ page }) => {
      await signInAs(page.request, 'host');
    });

    test('[AUTH-008] logs out from the sidebar of a team', async ({
      page,
      request
    }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      await page.goto(`/app/${team.slug}`);

      await page
        .getByRole('button', { name: toPersonaEmail('host', RUN_ID) })
        .click();
      await page.getByRole('menuitem', { name: 'Log out' }).click();

      await expectLoggedOut(page);
    });
  });
});
