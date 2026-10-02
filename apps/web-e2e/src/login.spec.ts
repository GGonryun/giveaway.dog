import { expect, test } from '@playwright/test';

const secret = process.env.E2E_LOGIN_SECRET ?? '';

test.describe('login', () => {
  test.skip(!secret, 'Set E2E_LOGIN_SECRET to run the login tests');

  test('signs a host in and opens the team picker', async ({ page }) => {
    const csrf = await page.request.get('/api/auth/csrf');
    const { csrfToken } = await csrf.json();

    const signIn = await page.request.post('/api/auth/callback/e2e', {
      form: { csrfToken, secret, callbackUrl: '/' },
      maxRedirects: 0
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
