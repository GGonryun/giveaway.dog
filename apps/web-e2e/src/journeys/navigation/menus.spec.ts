import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { toPersonaEmail } from '../../helpers/personas';

const openMobileMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog');
  await expect(menu).toBeVisible();
  return menu;
};

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
  test.beforeEach(({ isMobile }) => {
    test.skip(!isMobile, 'The menu button shows only on small screens');
  });

  test('the menu button has an accessible name', async ({ page }) => {
    await page.goto('/');

    const menuButton = page.locator('header button[aria-haspopup="dialog"]');
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAccessibleName(/\S/);
  });

  test('a visitor opens the Learn and Tools sections', async ({ page }) => {
    await page.goto('/contact');

    let menu = await openMobileMenu(page);
    await menu.getByRole('button', { name: 'Learn' }).click();
    await expect(
      menu.getByRole('link', { name: 'Integrations' })
    ).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Templates' })).toBeVisible();

    await menu.getByRole('button', { name: 'Tools' }).click();
    await menu.getByRole('link', { name: 'X Picker' }).click();

    await expect(page).toHaveURL(/\/pickers\/x$/);
    await expect(menu).toBeHidden();

    menu = await openMobileMenu(page);
    await menu.getByRole('link', { name: 'Get Started' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(menu).toBeHidden();
  });

  test('a visitor switches to the dark theme', async ({ page }) => {
    await page.goto('/contact');

    const menu = await openMobileMenu(page);
    await menu.getByRole('radio', { name: 'Dark theme' }).click();

    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  });

  test.describe('as a host', () => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
    test.use({ storageState: personaState('host') });

    test('a host sees the account links', async ({ page }) => {
      await page.goto('/contact');

      const menu = await openMobileMenu(page);

      for (const name of ['Upgrade to Pro', 'Dashboard', 'Account Settings']) {
        await expect(menu.getByRole('link', { name })).toBeVisible();
      }
      await expect(menu.getByRole('button', { name: 'Logout' })).toBeVisible();
    });
  });
});
