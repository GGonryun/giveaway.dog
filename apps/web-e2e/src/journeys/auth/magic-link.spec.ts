import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { BYPASS_STATE, E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import {
  requestMagicLink,
  skipWithoutEmailFake
} from '../../helpers/magic-link';
import { blockThirdParties } from '../../helpers/third-party';

test.describe('magic-link sign-in', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to read the outbox');

  test('signs in with the link from the email', async ({
    page,
    request
  }, testInfo) => {
    await skipWithoutEmailFake(request);
    const email = `e2e-magic-${freshNamespace(testInfo.workerIndex)}@example.com`;

    await page.goto('/login');
    const link = await requestMagicLink(page, request, email);
    await page.goto(link);
    await expect(page).not.toHaveURL(/\/(login|api\/auth\/)/);

    const session = await page.request.get('/api/auth/session');
    expect((await session.json()).user.email).toBe(email);
  });

  test(
    'shows that the email was sent',
    knownBug(446),
    async ({ page, request }, testInfo) => {
      await skipWithoutEmailFake(request);
      const email = `e2e-magic-${freshNamespace(testInfo.workerIndex)}@example.com`;

      await page.goto('/login');
      await requestMagicLink(page, request, email);

      await expect(page).toHaveURL(/\/login\?verify/);
      await expect(page.getByText('Check your email!')).toBeVisible();
    }
  );

  test('refuses an empty email address', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'More ways to sign in' }).click();
    await page.getByRole('button', { name: 'Login with Email' }).click();
    await page.getByRole('button', { name: 'Send Login Link' }).click();

    await expect(
      page.getByText('Please enter a valid email address.')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('the link works only once', async ({
    page,
    browser,
    request
  }, testInfo) => {
    await skipWithoutEmailFake(request);
    const email = `e2e-magic-${freshNamespace(testInfo.workerIndex)}@example.com`;

    await page.goto('/login');
    const link = await requestMagicLink(page, request, email);
    await page.goto(link);
    await expect(page).not.toHaveURL(/\/(login|api\/auth\/)/);

    const second = await browser.newContext({ storageState: BYPASS_STATE });
    try {
      await blockThirdParties(second);
      const reused = await second.newPage();
      await reused.goto(link);

      await expect(reused).toHaveURL(/\/login\?error=/);
      await expect(
        reused.getByText('An unexpected error occurred. Please try again.')
      ).toBeVisible();
      const session = await reused.request.get('/api/auth/session');
      expect(await session.json()).toBeNull();
    } finally {
      await second.close();
    }
  });
});
