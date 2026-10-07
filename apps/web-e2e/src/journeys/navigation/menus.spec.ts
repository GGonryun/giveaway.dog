import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { toPersonaEmail } from '../../helpers/personas';

test.describe('account menu', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ storageState: personaState('participant') });

  test('a participant opens the account menu from the avatar', async ({
    page
  }) => {
    await page.goto('/browse');

    await page.getByRole('button', { name: 'E2E participant' }).click();

    const menu = page.getByRole('menu');
    await expect(menu).toContainText(toPersonaEmail('participant', RUN_ID));
    await expect(menu.getByRole('menuitem', { name: /Logout/ })).toBeVisible();
  });
});

test.describe('mobile menu', { tag: '@mobile' }, () => {
  test(
    'the menu button has an accessible name',
    knownBug(100),
    async ({ page, isMobile }) => {
      test.skip(!isMobile, 'The menu button shows only on small screens');
      await page.goto('/');

      const menuButton = page.locator('header button[aria-haspopup="dialog"]');
      await expect(menuButton).toBeVisible();
      await expect(menuButton).toHaveAccessibleName(/\S/);
    }
  );
});
