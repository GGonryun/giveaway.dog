import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';

const THEME_STORAGE_KEY = 'giveaway-theme';

const chooseTheme = async (page: Page, name: 'Light' | 'Dark' | 'System') => {
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page.getByRole('menuitem', { name }).click();
};

test.describe('theme', () => {
  test('a visitor chooses the dark theme, and it survives a reload', async ({
    page
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/home');

    await chooseTheme(page, 'Dark');

    const html = page.locator('html');
    await expect(html).toHaveClass(/\bdark\b/);
    const { origins } = await page.context().storageState();
    const storage = origins.flatMap((origin) => origin.localStorage);
    expect(storage).toContainEqual({ name: THEME_STORAGE_KEY, value: 'dark' });

    await page.reload();

    await expect(html).toHaveClass(/\bdark\b/);
  });

  test('the System theme follows the color scheme of the device', async ({
    page
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/home');
    await chooseTheme(page, 'Light');

    const html = page.locator('html');
    await expect(html).not.toHaveClass(/\bdark\b/);

    await chooseTheme(page, 'System');
    await expect(html).toHaveClass(/\bdark\b/);

    await page.emulateMedia({ colorScheme: 'light' });
    await expect(html).not.toHaveClass(/\bdark\b/);
  });
});
