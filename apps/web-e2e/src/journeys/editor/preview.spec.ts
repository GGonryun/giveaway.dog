import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import {
  addTask,
  createDraft,
  issuesDialog,
  openStep,
  publishDialog
} from '../../helpers/editor';
import { knownBug } from '../../helpers/known-bug';
import { seedWorkerTeam } from '../../helpers/seed';

const NAME = 'Unsaved preview name';
const SIGN_IN_URLS = [
  '**/api/auth/signin/**',
  'https://accounts.google.com/**'
];
const SIGN_IN_WAIT = 10_000;

const isSignIn = (url: string) =>
  url.includes('/api/auth/signin/') ||
  url.startsWith('https://accounts.google.com/');

const countSubmits = async (page: Page) => {
  await page
    .locator('form')
    .first()
    .evaluate((form) => {
      form.dataset.submits = '0';
      form.addEventListener('submit', () => {
        form.dataset.submits = String(Number(form.dataset.submits) + 1);
      });
    });
  return () => page.locator('form').first().getAttribute('data-submits');
};

const openPreviewTask = (page: Page) =>
  page
    .getByRole('heading', { name: 'Click for a bonus entry', level: 4 })
    .click();

test.describe('the live preview of the editor', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('a task button in the preview does not submit the editor form', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    await createDraft(page, team.slug);
    await page.getByRole('textbox', { name: 'Name' }).fill(NAME);
    await openStep(page, 'Tasks');
    await addTask(page, 'Bonus');
    const submits = await countSubmits(page);

    await openPreviewTask(page);
    await page.getByRole('button', { name: 'Continue' }).click();

    expect(await submits()).toBe('0');
    await expect(issuesDialog(page)).toBeHidden();
    await expect(publishDialog(page)).toBeHidden();
    await openStep(page, 'Setup');
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(NAME);
  });

  test(
    'a provider button in the preview does not start a real sign-in',
    knownBug(113),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      for (const url of SIGN_IN_URLS) {
        await page.route(url, (route) => route.abort());
      }
      await createDraft(page, team.slug);
      await page.getByRole('textbox', { name: 'Name' }).fill(NAME);
      await openStep(page, 'Tasks');
      await addTask(page, 'Bonus');
      const submits = await countSubmits(page);

      await page.getByRole('button', { name: 'Active State' }).click();
      await page.getByRole('menuitem', { name: 'Not Logged In' }).click();
      await openPreviewTask(page);
      const signIn = page
        .waitForRequest((request) => isSignIn(request.url()), {
          timeout: SIGN_IN_WAIT
        })
        .then(
          (request) => request.url(),
          () => null
        );
      await page.getByRole('button', { name: 'Google', exact: true }).click();

      expect(await signIn).toBeNull();
      expect(await submits()).toBe('0');
      await expect(issuesDialog(page)).toBeHidden();
      await expect(publishDialog(page)).toBeHidden();
      await expect(page).toHaveURL(/\/create(\?|$)/);
      await openStep(page, 'Setup');
      await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
        NAME
      );
    }
  );
});
