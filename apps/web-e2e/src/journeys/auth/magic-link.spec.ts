import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { fakesOf, linkInEmail, waitForEmail } from '../../helpers/outbox';
import { seedApi } from '../../helpers/seed';

test.describe('magic-link sign-in', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to read the outbox');

  test('signs in with the link from the email', async ({
    page,
    request
  }, testInfo) => {
    const fakes = fakesOf(await seedApi(request).health());
    test.skip(!fakes.includes('email'), 'Set E2E_FAKE_EXTERNALS to email');
    const email = `e2e-magic-${freshNamespace(testInfo.workerIndex)}@example.com`;

    await page.goto('/login');
    await page.getByRole('button', { name: 'More ways to sign in' }).click();
    await page.getByRole('button', { name: 'Login with Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('button', { name: 'Send Login Link' }).click();

    const message = await waitForEmail(request, email, /Sign-In Link/);
    expect(message.to).toBe(email);
    await page.goto(linkInEmail(message, '/api/auth/callback/email'));
    await expect(page).not.toHaveURL(/\/api\/auth\//);

    const session = await page.request.get('/api/auth/session');
    expect((await session.json()).user.email).toBe(email);
  });
});
