import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../env';
import { seedApi, seedWorkerTeam } from '../helpers/seed';

const payload = (tag: string) =>
  `<p>Hello</p><img src="/logo.png" onerror="(window.__xss||=[]).push('${tag}')" onload="(window.__xss||=[]).push('${tag}')">`;

const MEDIA_TASK = 'Upload your best photo';

const watchDialogs = (page: Page) => {
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  return dialogs;
};

const expectNoScript = async (
  page: Page,
  container: Locator,
  dialogs: string[]
) => {
  await expect(container.getByText('Hello').first()).toBeVisible();
  expect(
    await container.evaluate((root) =>
      [root, ...root.querySelectorAll('*')].flatMap((element) =>
        element
          .getAttributeNames()
          .filter((name: string) => name.toLowerCase().startsWith('on'))
          .map((name: string) => `<${element.tagName.toLowerCase()} ${name}>`)
      )
    ),
    'Elements with an event handler attribute'
  ).toEqual([]);
  expect(
    await page.evaluate(() => (globalThis as { __xss?: unknown }).__xss)
  ).toBe(undefined);
  expect(dialogs).toEqual([]);
};

test.describe('host-written HTML', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  const seedGiveaway = async (
    request: Parameters<typeof seedWorkerTeam>[0],
    testInfo: Parameters<typeof seedWorkerTeam>[1]
  ) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    return seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      description: payload('d'),
      terms: { type: 'CUSTOM', text: payload('t') },
      tasks: [
        { type: 'BONUS_TASK' },
        { type: 'SUBMIT_MEDIA', title: MEDIA_TASK, description: payload('m') }
      ],
      audience: { formFields: [], allowedIdentities: ['ANONYMOUS'] }
    });
  };

  test('a visitor runs no script from the description or the terms', async ({
    page,
    request
  }, testInfo) => {
    const giveaway = await seedGiveaway(request, testInfo);
    const dialogs = watchDialogs(page);

    await page.goto(`/browse/${giveaway.id}`);
    await expectNoScript(page, page.locator('main'), dialogs);

    await page.getByRole('button', { name: 'Terms & Conditions' }).click();
    await expectNoScript(page, page.getByRole('dialog'), dialogs);
  });

  test.describe('as a participant', () => {
    test.use({ storageState: personaState('participant') });

    test('a participant runs no script from a task description', async ({
      page,
      request
    }, testInfo) => {
      const giveaway = await seedGiveaway(request, testInfo);
      const dialogs = watchDialogs(page);

      await page.goto(`/browse/${giveaway.id}`);
      await page.getByRole('heading', { name: MEDIA_TASK }).click();
      await expectNoScript(page, page.getByRole('tabpanel'), dialogs);
    });
  });
});
