import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { knownBug } from '../../helpers/known-bug';
import { isServerActionRequest } from '../../helpers/rsc';

const watchWrites = (page: Page) => {
  const writes: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (
      isServerActionRequest(request) ||
      url.pathname.startsWith('/api/auth')
    ) {
      if (request.method() !== 'GET') writes.push(`${request.method()} ${url}`);
    }
  });
  return writes;
};

const openSaveDialog = async (page: Page) => {
  await page.getByRole('button', { name: 'Save Changes' }).click();
  return page.getByRole('dialog', { name: 'Save Changes?' });
};

test.describe('demo editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/sweepstakes');
  });

  test('a visitor cannot save or publish from the demo', async ({ page }) => {
    const writes = watchWrites(page);

    const dialog = await openSaveDialog(page);

    await expect(dialog).toContainText(
      'Demo Mode: Publishing and saving are not available'
    );
    await dialog.getByRole('button', { name: 'Continue Editing' }).click();
    await expect(dialog).toBeHidden();
    expect(writes, 'The demo sent a write to the server').toEqual([]);
  });

  test(
    'the demo save dialog does not say the changes go live',
    knownBug(58),
    async ({ page }) => {
      const dialog = await openSaveDialog(page);

      await expect(dialog).toContainText('Demo Mode');
      await expect(dialog).not.toContainText('will go live');
    }
  );

  test('the demo nests no button in a link', knownBug(62), async ({ page }) => {
    await openSaveDialog(page);

    await expect(page.locator('a button')).toHaveCount(0);
  });
});
