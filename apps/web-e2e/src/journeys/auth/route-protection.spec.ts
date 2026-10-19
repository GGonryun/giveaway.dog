import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BASE_URL, E2E_SECRET, personaState } from '../../env';
import { expectSameOrigin, noRedirect } from '../../helpers/http';
import { seedWorkerTeam } from '../../helpers/seed';

const PROTECTED_PAGES = [
  '/account',
  '/account/danger-zone',
  '/app',
  '/app/any-slug/settings'
];

const PUBLIC_PAGES = ['/', '/home', '/browse', '/pickers/x', '/pricing'];

const expectLoginFor = async (page: Page, path: string) => {
  await expect(page).toHaveURL(/\/login\?callbackUrl=/);
  const callbackUrl = new URL(page.url()).searchParams.get('callbackUrl');
  expect(new URL(callbackUrl!, BASE_URL).pathname).toBe(path);
  await expect(page.getByText('Connect with us')).toBeVisible();
};

const expectLoggedOutNavbar = async (page: Page) => {
  const header = page.locator('header');
  await expect(header.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Get Started' })).toBeVisible();
};

const expectBrowse = async (page: Page) => {
  await expect(page).toHaveURL(/\/browse$/);
  await expect(
    page.getByRole('searchbox', { name: /Search giveaways/ })
  ).toBeVisible();
};

const expectTeamPicker = async (page: Page) => {
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText('Choose Your Team')).toBeVisible();
};

const expectOnboarding = async (page: Page) => {
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText('Welcome to Giveaway.dog')).toBeVisible();
};

test.describe('a visitor', () => {
  for (const path of PROTECTED_PAGES) {
    test(`is sent to the login page from ${path}`, async ({ page }) => {
      const response = await page.request.get(path, noRedirect);

      expect(response.status()).toBeGreaterThanOrEqual(300);
      expect(response.status()).toBeLessThan(400);
      const location = response.headers().location;
      expectSameOrigin(location);
      const target = new URL(location, BASE_URL);
      expect(target.pathname).toBe('/login');
      expect(
        new URL(target.searchParams.get('callbackUrl')!, BASE_URL).pathname
      ).toBe(path);

      await page.goto(path);

      await expectLoginFor(page, path);
    });
  }

  test('is sent home from the logout page', async ({ page }) => {
    await page.goto('/logout');

    await expect(page).toHaveURL(/\/$/);
    await expectLoggedOutNavbar(page);
  });

  for (const path of PUBLIC_PAGES) {
    test(`opens ${path} without signing in`, async ({ page }) => {
      const response = await page.request.get(path, noRedirect);
      expect(response.status()).toBe(200);

      await page.goto(path);

      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expectLoggedOutNavbar(page);
    });
  }
});

test.describe('a participant', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ storageState: personaState('participant') });

  test('has a participant session', async ({ page }) => {
    const session = await page.request.get('/api/auth/session');

    expect((await session.json()).user.accountType).toBe('PARTICIPANT');
  });

  test('is sent to browse from the host dashboard', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);

    for (const path of [
      '/app',
      `/app/${team.slug}`,
      `/app/${team.slug}/settings`,
      '/'
    ]) {
      await page.goto(path);

      await expectBrowse(page);
      await expect(page.getByText('Choose Your Team')).toBeHidden();
    }
  });

  test('is kept out of the login page', async ({ page }) => {
    for (const path of ['/login', '/login?verify=true']) {
      await page.goto(path);

      await expectBrowse(page);
    }
  });
});

test.describe('a host', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ storageState: personaState('host') });

  test('is kept out of the login page', async ({ page }) => {
    for (const path of ['/login', '/login?verify=true', '/']) {
      await page.goto(path);

      await expectTeamPicker(page);
    }
  });
});

test.describe('a user who has not finished onboarding', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('is sent to onboarding', async ({ page, freshPersona }) => {
    await freshPersona('newbie');

    for (const path of [
      '/account',
      '/account/history',
      '/app',
      '/browse',
      '/browse/any-id',
      '/pickers/x',
      '/'
    ]) {
      await page.goto(path);

      await expectOnboarding(page);
    }
  });

  test('opens the home and pricing pages', async ({ page, freshPersona }) => {
    await freshPersona('newbie');

    for (const path of ['/home', '/pricing']) {
      await page.goto(path);

      await expect(page).toHaveURL(new RegExp(`${path}$`));
    }
  });
});
