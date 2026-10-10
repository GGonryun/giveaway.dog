import { expect, test } from '../fixtures/test';
import { BASE_URL, E2E_SECRET } from '../env';
import { knownBug } from '../helpers/known-bug';

const THIRD_PARTY = 'https://third-party.e2e.invalid/';

const LINK_PATH = '/api/instagram/user/link';

test.describe('social profile links', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ allowedPageErrors: [/Failed to load resource/] });

  test(
    'a page on another site links no Instagram profile to the visitor',
    knownBug(348),
    async ({ page, freshPersona }) => {
      const { ns } = await freshPersona('participant');
      const username = `e2e_${ns}`;
      const link = new URL(LINK_PATH, BASE_URL);
      link.search = new URLSearchParams({
        profileUrl: `https://instagram.com/${username}`,
        username
      }).toString();

      await page.route(THIRD_PARTY, (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: `<a href="${link.href}">Claim your prize</a>`
        })
      );
      await page.goto(THIRD_PARTY);

      const [response] = await Promise.all([
        page.waitForResponse((r) => new URL(r.url()).pathname === LINK_PATH),
        page.getByRole('link', { name: 'Claim your prize' }).click()
      ]);
      const { cookie } = await response.request().allHeaders();
      expect(cookie, 'The browser sent no session cookie').toMatch(
        /authjs\.session-token/
      );

      const account = await page.request.get('/account', {
        headers: { RSC: '1' }
      });
      expect(account.status()).toBe(200);
      expect(
        await account.text(),
        `The account of the visitor has the profile @${username}`
      ).not.toContain(`@${username}`);
    }
  );
});
