import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import {
  PAGE_ERROR_ALLOWLIST,
  blockThirdParties,
  watchPageErrors
} from '../../helpers/third-party';

// UTC-12 and UTC+14. At any hour, the date in one of them differs from the
// date in UTC, where the server renders. The home page shows the dates of
// the sample giveaway in the time zone of the renderer.
const TIME_ZONES = ['Etc/GMT+12', 'Pacific/Kiritimati'];

test.describe('time zones', () => {
  test(
    'the home page hydrates far from UTC',
    knownBug(366),
    async ({ browser }) => {
      const errors: string[] = [];

      for (const timezoneId of TIME_ZONES) {
        const context = await browser.newContext({
          storageState: BYPASS_STATE,
          timezoneId
        });
        await blockThirdParties(context);
        const readErrors = watchPageErrors(context, PAGE_ERROR_ALLOWLIST);

        const page = await context.newPage();
        await page.goto('/home');
        // The preview hydrates in its own Suspense boundary, when the browser
        // is idle. A click on its tab hydrates it at once.
        const prizes = page.getByRole('tab', { name: 'Prizes' }).first();
        // A failed hydration renders the tree again and can drop the click.
        await expect(async () => {
          await prizes.click();
          await expect(prizes).toHaveAttribute('aria-selected', 'true', {
            timeout: 1_000
          });
        }).toPass();

        errors.push(...readErrors().map((error) => `${timezoneId}: ${error}`));
        await context.close();
      }

      expect(errors).toEqual([]);
    }
  );
});
