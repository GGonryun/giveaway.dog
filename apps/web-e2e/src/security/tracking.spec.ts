import { expect, test } from '../fixtures/test';
import { E2E_SECRET, personaState } from '../env';
import { knownBug } from '../helpers/known-bug';
import { isServerActionRequest } from '../helpers/rsc';

const WATCH_MS = 5000;

test.describe('user tracking', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ storageState: personaState('participant') });

  test(
    'a signed-in visitor whose browser keeps no cookie is tracked at most once',
    knownBug(75),
    async ({ page, context }) => {
      await context.clearCookies({ name: 'user_metrics' });
      await page.addInitScript(() => {
        const descriptor = Object.getOwnPropertyDescriptor(
          Document.prototype,
          'cookie'
        );
        if (!descriptor?.get || !descriptor.set) return;
        const { get, set } = descriptor;
        Object.defineProperty(document, 'cookie', {
          configurable: true,
          get() {
            return get.call(this);
          },
          set(value: string) {
            if (!value.startsWith('user_metrics=')) set.call(this, value);
          }
        });
      });

      const tracked: string[] = [];
      page.on('response', async (response) => {
        if (!isServerActionRequest(response.request())) return;
        const body = await response.text().catch(() => '');
        if (body.includes('"countryCode"')) tracked.push(response.url());
      });

      await page.goto('/browse');
      await page.waitForTimeout(WATCH_MS);

      expect(tracked.length, tracked.join('\n')).toBeLessThanOrEqual(1);
    }
  );
});
