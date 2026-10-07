import { expect, test } from '../fixtures/test';
import { E2E_SECRET as secret } from '../env';
import { noRedirect } from '../helpers/http';

test.describe('login', { tag: '@smoke' }, () => {
  test.skip(!secret, 'Set E2E_LOGIN_SECRET to run the login tests');

  test('signs a host in and opens the team picker', async ({ page }) => {
    const csrf = await page.request.get('/api/auth/csrf');
    const { csrfToken } = await csrf.json();

    const signIn = await page.request.post('/api/auth/callback/e2e', {
      form: { csrfToken, secret, callbackUrl: '/' },
      ...noRedirect
    });

    expect(signIn.status()).toBe(302);
    expect(
      signIn.headers().location,
      'Sign-in failed. The deployment needs the same E2E_LOGIN_SECRET.'
    ).not.toContain('error');

    await page.goto('/');

    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByText('Choose Your Team')).toBeVisible();
  });
});
