import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { newDiscordId, useMockOAuth } from '../../helpers/oauth';
import { seedApi } from '../../helpers/seed';

type AccountRows = {
  user: { id: string; email: string; source: string; emailVerified: string };
  accounts: { provider: string; providerAccountId: string; status: string }[];
};

test.describe('mock OAuth sign-in', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to use the mock OAuth provider');

  test('a first Discord sign-in creates a new user', async ({
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

  test(
    "a new user's first OAuth sign-in lands on onboarding",
    knownBug(428),
    async ({ page, context }, testInfo) => {
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
    }
  );
});
