import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import {
  createDraft,
  editorTab,
  fillComplete,
  giveawayName,
  headerButton,
  issuesDialog,
  openStep,
  publishDialog
} from '../../helpers/editor';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const ISSUES = [
  'setup.name String must contain at least 3 character(s)',
  'setup.banner Required',
  'tasks At least one entry method is required',
  'prizes At least one prize is required'
];

const expectIssues = async (page: Page) => {
  const dialog = issuesDialog(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('paragraph')).toHaveText(
    `${ISSUES.length} issues need to be fixed before you can publish`
  );
  for (const issue of ISSUES) {
    await expect(dialog.getByRole('button', { name: issue })).toBeVisible();
  }
  await expect(publishDialog(page)).toBeHidden();
};

const readDraft = async (request: APIRequestContext, id: string) => {
  const { sweepstakes } = await seedApi(request).rows<{
    sweepstakes: { status: string; details: { name: string } };
  }>({ view: 'sweepstakes', id });
  return sweepstakes;
};

test.describe('an incomplete giveaway in the editor', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test(
    'a host sees every blocking issue and saves the giveaway as a draft',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const id = await createDraft(page, team.slug);

      await page.getByRole('textbox', { name: 'Name' }).fill('');
      await headerButton(page, 'Publish').click();
      await expectIssues(page);

      await issuesDialog(page).getByRole('button', { name: ISSUES[3] }).click();
      await expect(issuesDialog(page)).toBeHidden();
      await expect(editorTab(page, 'Prizes')).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(editorTab(page, 'Setup')).toHaveAccessibleName('Setup 2');
      await expect(editorTab(page, 'Tasks')).toHaveAccessibleName('Tasks 1');
      await expect(editorTab(page, 'Prizes')).toHaveAccessibleName('Prizes 1');

      await page.getByRole('button', { name: '4 Issues' }).click();
      await issuesDialog(page)
        .getByRole('button', { name: 'Save & Exit' })
        .click();
      await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
        timeout: 30_000
      });
      expect(await readDraft(request, id)).toMatchObject({ status: 'DRAFT' });

      await page.goto(`/app/${team.slug}/sweepstakes/${id}/create`);
      await headerButton(page, 'Publish').click();
      await expectIssues(page);
    }
  );

  test('a draft saved with an empty name is named Untitled Sweepstakes', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const id = await createDraft(page, team.slug);

    await page.getByRole('textbox', { name: 'Name' }).fill('');
    await headerButton(page, 'Cancel').click();
    await page.getByRole('button', { name: 'Save & Exit' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
      timeout: 30_000
    });

    expect(await readDraft(request, id)).toMatchObject({
      details: { name: 'Untitled Sweepstakes' }
    });
  });

  test(
    'a host cannot publish a giveaway with an empty description',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      await createDraft(page, team.slug);
      await fillComplete(page, { name: giveawayName(testInfo, 'nodesc') });

      await openStep(page, 'Setup');
      await page
        .getByRole('main')
        .getByText('Enter to win a prize!')
        .first()
        .click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('Backspace');
      await headerButton(page, 'Publish').click();

      await expect(issuesDialog(page)).toBeVisible();
      await expect(
        issuesDialog(page).getByRole('button', {
          name: 'setup.description String must contain at least 3 character(s)'
        })
      ).toBeVisible();
      await expect(publishDialog(page)).toBeHidden();
    }
  );
});
