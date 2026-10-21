import { expect, test } from '../fixtures/test';
import { freshNamespace } from '../fixtures/personas';
import { BYPASS_STATE, E2E_SECRET } from '../env';
import { knownBug } from '../helpers/known-bug';
import { requestMagicLink, skipWithoutEmailFake } from '../helpers/magic-link';
import { newDiscordId, useMockOAuth } from '../helpers/oauth';
import { toPersonaEmail } from '../helpers/personas';
import { seedApi } from '../helpers/seed';
import { TAGS } from '../helpers/tags';
import { blockThirdParties } from '../helpers/third-party';

const signInEnded = (url: URL) =>
  !url.pathname.startsWith('/api/') &&
  (url.pathname !== '/login' || url.searchParams.has('error'));

test.describe('account linking', { tag: TAGS.security }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[LINK-001] an unverified email change does not capture a magic-link sign-in', async ({
    page,
    browser,
    request,
    freshPersona
  }, testInfo) => {
    await skipWithoutEmailFake(request);
    const attacker = await freshPersona('participant');
    await seedApi(request).userExtras({
      ns: attacker.ns,
      users: [{ persona: 'participant', emailVerified: false }]
    });
    const victim = toPersonaEmail(
      'newbie',
      freshNamespace(testInfo.workerIndex)
    );

    await page.goto('/account');
    await page.getByPlaceholder('Enter your email address').fill(victim);
    await page.getByRole('button', { name: 'Update Email' }).click();
    await expect(
      page.getByRole('heading', { name: 'Check Your Email' })
    ).toBeVisible();

    const owner = await browser.newContext({ storageState: BYPASS_STATE });
    try {
      await blockThirdParties(owner);
      const ownerPage = await owner.newPage();
      await ownerPage.goto('/login');
      const link = await requestMagicLink(ownerPage, request, victim);
      await ownerPage.goto(link);
      await ownerPage.waitForURL(signInEnded, { timeout: 30_000 });

      const session = await ownerPage.request.get('/api/auth/session');
      expect((await session.json())?.user?.id).not.toBe(attacker.id);
    } finally {
      await owner.close();
    }
  });

  test(
    '[LINK-002] an unverified Discord email does not sign into another account',
    knownBug(431),
    async ({ page, context, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const {
        users: [victim]
      } = await seedApi(request).userExtras({
        ns,
        users: [{ persona: 'participant' }]
      });
      await useMockOAuth(context, 'discord', {
        id: newDiscordId(),
        username: `e2e_${ns}`,
        email: victim.email,
        verified: false
      });

      await page.goto('/login');
      await page.getByRole('button', { name: 'Login with Discord' }).click();
      await page.waitForURL(signInEnded, { timeout: 30_000 });

      const session = await page.request.get('/api/auth/session');
      expect((await session.json())?.user?.id).not.toBe(victim.userId);
    }
  );
});
