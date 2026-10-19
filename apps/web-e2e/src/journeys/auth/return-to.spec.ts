import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import {
  requestMagicLink,
  skipWithoutEmailFake
} from '../../helpers/magic-link';
import { seedApi } from '../../helpers/seed';

test.describe('return after sign-in', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test(
    'a visitor returns to the page they asked for after signing in',
    knownBug(429),
    async ({ page, request }, testInfo) => {
      await skipWithoutEmailFake(request);
      const {
        users: [{ email }]
      } = await seedApi(request).userExtras({
        ns: freshNamespace(testInfo.workerIndex),
        users: [{ persona: 'participant' }]
      });

      await page.goto('/account/history');
      await expect(page).toHaveURL(/\/login\?callbackUrl=/);
      const link = await requestMagicLink(page, request, email);
      await page.goto(link);

      await expect(page).toHaveURL(/\/account\/history$/);
    }
  );
});
