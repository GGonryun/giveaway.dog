import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { E2E_SECRET, personaState } from '../env';
import { createDraft, headerButton } from '../helpers/editor';
import { seedWorkerTeam } from '../helpers/seed';
import { TAGS } from '../helpers/tags';

const MAX_TABS = 80;

const holdsFocus = (target: Locator) =>
  target.evaluate((element) => element.matches(':focus, :focus-within'));

const tabTo = async (page: Page, target: Locator, name: string) => {
  for (let tabs = 0; tabs < MAX_TABS; tabs++) {
    await page.keyboard.press('Tab');
    if (await holdsFocus(target)) return;
  }
  throw new Error(`${name} was not reached after ${MAX_TABS} presses of Tab`);
};

const dropZone = (page: Page) =>
  page.getByRole('button', { name: 'Banner Image', exact: true });

test.describe('keyboard only', { tag: TAGS.a11y }, () => {
  test('a visitor reaches every login option with the Tab key', async ({
    page
  }) => {
    await page.goto('/login');
    const options = page.getByRole('button', { name: /^Login with / });
    await expect(options.first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    const names = await options.allTextContents();
    for (const [index, name] of names.entries()) {
      await tabTo(page, options.nth(index), name.trim());
    }
  });

  test.describe('the first step of the editor', () => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
    test.use({ storageState: personaState('host') });

    test('a host reaches Publish with the Tab key', async ({
      page,
      request
    }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      await createDraft(page, team.slug);
      await page.reload();
      await expect(headerButton(page, 'Publish')).toBeVisible();
      await page.waitForLoadState('networkidle');

      await tabTo(page, headerButton(page, 'Publish'), 'Publish');
    });

    test('a host opens the file picker of the banner drop zone with the keyboard', async ({
      page,
      request
    }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      await createDraft(page, team.slug);
      await page.reload();
      await expect(dropZone(page)).toBeVisible();
      await page.waitForLoadState('networkidle');

      await tabTo(page, dropZone(page), 'The banner drop zone');
      const chooser = page.waitForEvent('filechooser', { timeout: 5_000 });
      await page.keyboard.press('Enter');
      await chooser;
    });
  });
});
