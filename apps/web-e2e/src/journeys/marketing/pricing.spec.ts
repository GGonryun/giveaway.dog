import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';

test.describe('pricing', () => {
  test('a visitor opens /pricing and sees the yearly price', async ({
    page
  }) => {
    await page.goto('/pricing');

    await expect(page).toHaveURL(/\/home#pricing$/);
    await expect(
      page.getByRole('heading', { name: /Get more views with less effort/ })
    ).toBeInViewport();

    await page.getByRole('button', { name: 'Yearly' }).click();

    const pricing = page.locator('#pricing');
    await expect(pricing.getByText('$15', { exact: true })).toBeVisible();
    await expect(pricing.getByText('Billed as $180.00/year')).toBeVisible();
  });

  test.describe('as a host', () => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
    test.use({ storageState: personaState('host') });

    // Contact Us links to /login, which sends a signed-in host to / and then
    // to /app. The X picker and avatar menu upsells end there too.
    test(
      'a host follows the Pro call to action to a page about Pro',
      knownBug(363),
      async ({ page }) => {
        await page.goto('/home#pricing');

        await page
          .locator('#pricing')
          .getByRole('link', { name: /Contact Us/ })
          .click();

        // Every step of the dead end: /login, / and /app.
        await expect(page).toHaveURL(
          (url) => !/^\/(app|login|home)?$/.test(url.pathname)
        );
      }
    );
  });
});
