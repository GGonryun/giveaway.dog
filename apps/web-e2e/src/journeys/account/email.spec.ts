import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE, E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import {
  requestMagicLink,
  skipWithoutEmailFake
} from '../../helpers/magic-link';
import { linkInEmail, waitForEmail } from '../../helpers/outbox';
import { toPersonaEmail } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';
import { blockThirdParties } from '../../helpers/third-party';

const VERIFY_TIMEOUT = 20_000;

const emailCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({ hasText: 'Email Verification' });

const changeEmail = async (page: Page, email: string) => {
  await page.waitForLoadState('networkidle');
  await emailCard(page).getByRole('button', { name: 'Change' }).click();
  await page.getByPlaceholder('Enter your email address').fill(email);
  await emailCard(page).getByRole('button', { name: 'Update Email' }).click();
};

const verificationLink = async (page: Page, email: string): Promise<string> =>
  linkInEmail(
    await waitForEmail(page.request, email, /Verify your email/),
    '/portal'
  );

const readSession = async (page: Page) =>
  (await (await page.request.get('/api/auth/session')).json())?.user;

test.describe('email change', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test.beforeEach(async ({ request }) => {
    await skipWithoutEmailFake(request);
  });

  test('[ACCOUNT-012] a user changes their email address and verifies it', async ({
    page,
    freshPersona
  }) => {
    const { email, ns } = await freshPersona('participant');
    const next = toPersonaEmail('participant2', ns);
    await page.goto('/account');

    await changeEmail(page, next);

    await expect(page.getByText('Check Your Email')).toBeVisible();
    await expect(emailCard(page)).toContainText(next);
    await page.reload();
    await expect(emailCard(page)).toContainText(email);
    expect((await readSession(page)).email).toBe(email);

    await page.goto(await verificationLink(page, next));
    await expect(page.getByText('Email Verified!')).toBeVisible({
      timeout: VERIFY_TIMEOUT
    });

    await page.goto('/account');
    await expect(emailCard(page)).toContainText(`Connected • ${next}`);
  });

  test('[ACCOUNT-013] a user cannot change their email to an address that another user verified', async ({
    page,
    request,
    freshPersona
  }) => {
    const { email, ns } = await freshPersona('participant');
    const {
      users: [taken]
    } = await seedApi(request).userExtras({
      ns,
      users: [{ persona: 'participant2', emailVerified: true }]
    });
    await page.goto('/account');

    await changeEmail(page, taken.email);

    await expect(
      page.getByText('Email address is already in use')
    ).toBeVisible();
    await page.reload();
    await expect(emailCard(page)).toContainText(email);
    expect((await readSession(page)).email).toBe(email);
  });

  test(
    '[ACCOUNT-015] a verification link opened while signed out verifies the address after the user signs in',
    knownBug(567),
    async ({ browser, page, freshPersona }) => {
      const { email, ns } = await freshPersona('participant');
      const next = toPersonaEmail('participant2', ns);
      await page.goto('/account');
      await changeEmail(page, next);
      await expect(page.getByText('Check Your Email')).toBeVisible();
      const link = await verificationLink(page, next);

      const visitor = await browser.newContext({ storageState: BYPASS_STATE });
      await blockThirdParties(visitor);
      const signedOut = await visitor.newPage();
      await signedOut.goto(link);
      await expect(signedOut).toHaveURL(/\/login/, { timeout: VERIFY_TIMEOUT });
      await signedOut.goto(
        await requestMagicLink(signedOut, signedOut.request, email)
      );

      await expect(signedOut.getByText('Email Verified!')).toBeVisible({
        timeout: VERIFY_TIMEOUT
      });
      await page.goto('/account');
      await expect(emailCard(page)).toContainText(`Connected • ${next}`);
      await visitor.close();
    }
  );
});

test.describe('email verification errors', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ allowedPageErrors: [/Email verification failed/] });

  test.beforeEach(async ({ request }) => {
    await skipWithoutEmailFake(request);
  });

  test('[ACCOUNT-014] a verification link with a wrong token verifies nothing', async ({
    page,
    freshPersona
  }) => {
    const { email, ns } = await freshPersona('participant');
    const next = toPersonaEmail('participant2', ns);
    await page.goto('/account');
    await changeEmail(page, next);
    await expect(page.getByText('Check Your Email')).toBeVisible();
    const link = new URL(await verificationLink(page, next));
    link.searchParams.set('token', 'bogus');

    await page.goto(link.href);

    await expect(page.getByText('Verification Error')).toBeVisible({
      timeout: VERIFY_TIMEOUT
    });
    await expect(
      page.getByText('Invalid or expired verification token')
    ).toBeVisible();
    await page.goto('/account');
    await expect(emailCard(page)).toContainText(email);
  });
});
