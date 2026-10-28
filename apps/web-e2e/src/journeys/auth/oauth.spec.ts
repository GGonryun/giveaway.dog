import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { toE2ePersonaAccountId } from '@giveaway/e2e-model/personas';
import { E2E_SECRET } from '../../env';
import {
  clickTikTokLogin,
  newDiscordId,
  useMockOAuth
} from '../../helpers/oauth';
import { seedApi } from '../../helpers/seed';

type AccountRows = {
  user: {
    id: string;
    email: string | null;
    source: string;
    emailVerified: string | null;
  };
  accounts: { provider: string; providerAccountId: string; status: string }[];
};

test.describe('mock OAuth sign-in', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to use the mock OAuth provider');

  test('[AUTH-005] a first Discord sign-in creates a new user', async ({
    page,
    context,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const email = `e2e-newbie-${ns}@example.com`;
    const id = newDiscordId();
    await useMockOAuth(context, 'discord', {
      id,
      username: `e2e_${ns}`,
      global_name: 'E2E Discord',
      email
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Login with Discord' }).click();
    await expect(page).not.toHaveURL(/\/(login|api\/)/, { timeout: 15_000 });

    const session = await page.request.get('/api/auth/session');
    const { user } = await session.json();
    expect(user).toMatchObject({ email, name: 'E2E Discord' });

    const rows = await seedApi(request).rows<AccountRows>({
      view: 'accounts',
      persona: 'newbie',
      ns
    });
    expect(rows.user).toMatchObject({ id: user.id, email, source: 'SIGNUP' });
    expect(rows.user.emailVerified).toBeTruthy();
    expect(rows.accounts).toEqual([
      expect.objectContaining({
        provider: 'discord',
        providerAccountId: id,
        status: 'ACTIVE'
      })
    ]);
  });

  test("[AUTH-006] a new user's first OAuth sign-in lands on onboarding", async ({
    page,
    context
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    await useMockOAuth(context, 'discord', {
      id: newDiscordId(),
      username: `e2e_${ns}`,
      email: `e2e-newbie-${ns}@example.com`
    });

    await page.goto('/login');
    await page.getByRole('button', { name: 'Login with Discord' }).click();

    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 15_000 });
    await expect(page.getByText('Welcome to Giveaway.dog')).toBeVisible();
    const session = await page.request.get('/api/auth/session');
    expect((await session.json()).user.onboarded).toBe(false);
  });

  test('[AUTH-015] a TikTok user is signed in and opens their account page', async ({
    page,
    context,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const openId = toE2ePersonaAccountId('newbie', ns);
    await useMockOAuth(context, 'tiktok', {
      open_id: openId,
      username: `e2e_tiktok_${ns}`,
      display_name: 'E2E TikTok'
    });

    await clickTikTokLogin(page);
    await expect(page).not.toHaveURL(/\/(login|api\/)/, { timeout: 15_000 });

    const session = await page.request.get('/api/auth/session');
    const { user } = await session.json();
    expect(user).toMatchObject({ name: 'E2E TikTok' });
    expect(user.email ?? null).toBeNull();

    const rows = await seedApi(request).rows<AccountRows>({
      view: 'accounts',
      persona: 'newbie',
      ns,
      provider: 'tiktok'
    });
    expect(rows.user).toMatchObject({ id: user.id, email: null });
    expect(rows.accounts).toEqual([
      expect.objectContaining({ provider: 'tiktok', providerAccountId: openId })
    ]);

    await page.goto('/onboarding');
    await expect(page.getByText('Welcome to Giveaway.dog')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('Username').fill(`e2e_${ns}`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Complete Setup' }).click();
    await expect(page).toHaveURL(/\/browse$/, { timeout: 15_000 });
    const onboarded = await page.request.get('/api/auth/session');
    expect((await onboarded.json()).user).toMatchObject({
      id: user.id,
      onboarded: true
    });

    await page.goto('/account');
    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByRole('button', { name: 'Logout', exact: true })
    ).toBeVisible();
  });
});
