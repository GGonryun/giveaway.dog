import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { knownBug } from '../../helpers/known-bug';

const GENERIC_ERROR = 'An unexpected error occurred. Please try again.';

const SIGN_IN_ERRORS = [
  {
    error: 'OAuthAccountNotLinked',
    message:
      'An account with the same email address already exists. Please sign in using a different method.'
  },
  {
    error: 'OAuthCallbackError',
    message:
      'User canceled the sign-in process or an error occurred during sign-in. Please try again.'
  },
  {
    error: 'AccessDenied',
    message: 'Access was denied. Please check your permissions and try again.'
  },
  { error: 'CredentialsSignin', message: GENERIC_ERROR },
  { error: 'bluesky_auth_failed', message: GENERIC_ERROR },
  { error: 'nonsense', message: GENERIC_ERROR }
];

const openBlueskyForm = async (page: Page) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Login with Bluesky' }).click();
  return page.getByRole('textbox', { name: 'Bluesky Handle' });
};

test.describe('the login page', () => {
  for (const { error, message } of SIGN_IN_ERRORS) {
    test(`[AUTH-010] explains the ${error} error`, async ({ page }) => {
      await page.goto(`/login?error=${error}`);

      await expect(page.getByText(message)).toBeVisible();
      await expect(page.getByText('Connect with us')).toBeVisible();
    });
  }

  test('[AUTH-012] refuses an empty Bluesky handle', async ({ page }) => {
    await openBlueskyForm(page);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Bluesky handle is required')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('[AUTH-012] refuses a malformed Bluesky handle', async ({ page }) => {
    const handle = await openBlueskyForm(page);
    await handle.fill('not a handle');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(
      page.getByText(
        'Invalid Bluesky handle format. Must be a valid domain (e.g., username.bsky.social)'
      )
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('[AUTH-012] cancels the Bluesky sign-in', async ({ page }) => {
    await openBlueskyForm(page);
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(
      page.getByRole('button', { name: 'Login with Bluesky' })
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Bluesky Handle' })
    ).toBeHidden();
  });

  test(
    '[AUTH-013] returns to the login page when a Bluesky handle cannot be found',
    knownBug(479),
    async ({ page }) => {
      const handle = await openBlueskyForm(page);
      await handle.fill('nobody.invalid');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(/\/login\?error=bluesky_auth_failed$/, {
        timeout: 15_000
      });
      await expect(page.getByText(GENERIC_ERROR)).toBeVisible();
    }
  );

  test('[AUTH-011] refuses an email address that is not valid', async ({
    page
  }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'More ways to sign in' }).click();
    await page.getByRole('button', { name: 'Login with Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('not-an-email');
    await page.getByRole('button', { name: 'Send Login Link' }).click();

    await expect(
      page.getByText('Please enter a valid email address.')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
