import type { Browser, Page } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE, E2E_SECRET } from '../../env';
import { signInAs, type SignedInPersona } from '../../helpers/personas';
import { blockThirdParties } from '../../helpers/third-party';

const deleteAccount = async (page: Page) => {
  await page.goto('/account/danger-zone');
  await page.getByRole('button', { name: 'Delete Account' }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete Account' })
    .click();
  await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
};

const expectSignedOut = async (page: Page) => {
  const session = await page.request.get('/api/auth/session');
  expect(await session.json()).toBeNull();

  await page.goto('/login');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Connect with us')).toBeVisible();
};

const withOtherDevice = async (
  browser: Browser,
  user: SignedInPersona,
  run: (page: Page) => Promise<void>
) => {
  const context = await browser.newContext({ storageState: BYPASS_STATE });
  try {
    await blockThirdParties(context);
    await signInAs(context.request, user.persona, user.ns);
    await run(await context.newPage());
  } finally {
    await context.close();
  }
};

const CASES: { persona: E2ePersona; path: string }[] = [
  { persona: 'participant', path: '/browse' },
  { persona: 'host', path: '/app' }
];

test.describe('a deleted account', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  for (const { persona, path } of CASES) {
    test(`[AUTH-014] a ${persona} is signed out on another device`, async ({
      page,
      browser,
      freshPersona
    }) => {
      const user = await freshPersona(persona);

      await withOtherDevice(browser, user, async (other) => {
        await other.goto(path);
        await expect(other).toHaveURL(new RegExp(`${path}$`));

        await deleteAccount(page);

        await other.goto(path);
        await expectSignedOut(other);
      });
    });
  }
});
