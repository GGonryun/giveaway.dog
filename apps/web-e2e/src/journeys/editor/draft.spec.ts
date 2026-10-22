import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import {
  addPrize,
  addTask,
  createDraft,
  giveawayName,
  headerButton,
  openStep,
  type EditorStep
} from '../../helpers/editor';
import { freshSlug, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const VISIT_URL = 'https://example.com/e2e';
const VISIT_QUESTION = 'What did you see?';
const CHOICE_QUESTION = 'Pick a color';
const CHOICES = ['Red', 'Blue'];
const PRIZES = [
  { name: 'Grand e2e prize', winners: '2' },
  { name: 'Small e2e prize', winners: '1' }
];

const openSavedStep = async (page: Page, url: string, step: EditorStep) => {
  await page.goto(`${url}?step=${step.toLowerCase()}`);
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
};

const selectOption = async (page: Page, combobox: string, option: RegExp) => {
  await page.getByRole('combobox', { name: combobox }).click();
  await page.getByRole('option', { name: option }).click();
};

test.describe('save a draft in the editor', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test(
    'a host saves a draft and reopens it with every value intact',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const id = await createDraft(page, team.slug);
      const url = `/app/${team.slug}/sweepstakes/${id}/create`;
      const name = giveawayName(testInfo, 'draft');
      const slug = freshSlug(testInfo);

      await page.getByRole('textbox', { name: 'Name' }).fill(name);
      await page
        .getByRole('main')
        .getByText('Enter to win a prize!')
        .first()
        .click();
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type('Bold e2e description');
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.press('ControlOrMeta+b');
      await selectOption(page, 'Timezone', /New York/);

      await openStep(page, 'Audience');
      await page
        .getByRole('switch', { name: 'Require Pre-Entry Login' })
        .click();
      await selectOption(page, 'Visibility Type', /^Private$/);
      await page.getByRole('switch', { name: 'Custom URL Slug' }).click();
      await page.getByRole('textbox', { name: 'URL slug' }).fill(slug);
      await expect(
        page.getByText(`The slug "${slug}" is available`)
      ).toBeVisible();

      await openStep(page, 'Tasks');
      await addTask(page, 'Visit URL');
      await page.getByRole('textbox', { name: 'Link URL' }).fill(VISIT_URL);
      await page.getByRole('radio', { name: 'Ask a question' }).click();
      await page
        .getByRole('textbox', { name: 'Question' })
        .fill(VISIT_QUESTION);
      await addTask(page, 'Enter Secret Code');
      await addTask(page, 'Single Choice');
      await page
        .getByRole('textbox', { name: 'Question' })
        .last()
        .fill(CHOICE_QUESTION);
      await page.getByRole('textbox', { name: 'Option 1' }).fill(CHOICES[0]);
      await page.getByRole('textbox', { name: 'Option 2' }).fill(CHOICES[1]);

      await openStep(page, 'Selection');
      await page
        .getByRole('spinbutton', { name: 'Minimum Tasks Completed' })
        .fill('2');
      await page.getByRole('radio', { name: 'None' }).click();
      await page.getByRole('switch', { name: 'Allow Multiple Wins' }).click();
      await page.getByRole('switch', { name: 'Allow Prize Selection' }).click();

      await openStep(page, 'Prizes');
      for (const [index, prize] of PRIZES.entries()) {
        await addPrize(page);
        await page.getByText(`Prize ${index + 1}`, { exact: true }).click();
        await page
          .getByRole('textbox', { name: 'Prize name' })
          .last()
          .fill(prize.name);
        await page
          .getByRole('spinbutton', { name: 'Winners' })
          .last()
          .fill(prize.winners);
      }

      await openStep(page, 'Design');
      await page.getByRole('switch', { name: 'Display Description' }).click();
      await selectOption(page, 'Background', /^Gradient$/);

      await headerButton(page, 'Cancel').click();
      await page.getByRole('button', { name: 'Save & Exit' }).click();
      await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
        timeout: 30_000
      });

      await openSavedStep(page, url, 'Setup');
      await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
        name
      );
      await expect(
        page
          .getByRole('main')
          .getByRole('strong')
          .filter({
            hasText: 'Bold e2e description'
          })
          .first()
      ).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: 'Timezone' })
      ).toContainText('New York');

      await openSavedStep(page, url, 'Audience');
      await expect(
        page.getByRole('switch', { name: 'Require Pre-Entry Login' })
      ).toBeChecked();
      await expect(
        page.getByRole('combobox', { name: 'Visibility Type' })
      ).toHaveText('Private');
      await expect(page.getByRole('textbox', { name: 'URL slug' })).toHaveValue(
        slug
      );

      await openSavedStep(page, url, 'Tasks');
      await expect(
        page
          .getByRole('main')
          .getByText(/^(Visit URL|Enter Secret Code|Single Choice)$/)
      ).toHaveText(['Visit URL', 'Enter Secret Code', 'Single Choice']);
      for (const task of ['Visit URL', 'Single Choice']) {
        await page.getByRole('main').getByText(task, { exact: true }).click();
      }
      await expect(page.getByRole('textbox', { name: 'Link URL' })).toHaveValue(
        VISIT_URL
      );
      await expect(
        page.getByRole('radio', { name: 'Ask a question' })
      ).toBeChecked();
      const questions = page.getByRole('textbox', { name: 'Question' });
      await expect(questions.first()).toHaveValue(VISIT_QUESTION);
      await expect(questions.last()).toHaveValue(CHOICE_QUESTION);
      await expect(page.getByRole('textbox', { name: 'Option 1' })).toHaveValue(
        CHOICES[0]
      );
      await expect(page.getByRole('textbox', { name: 'Option 2' })).toHaveValue(
        CHOICES[1]
      );

      await openSavedStep(page, url, 'Selection');
      await expect(
        page.getByRole('spinbutton', { name: 'Minimum Tasks Completed' })
      ).toHaveValue('2');
      await expect(page.getByRole('radio', { name: 'None' })).toBeChecked();
      await expect(
        page.getByRole('switch', { name: 'Allow Multiple Wins' })
      ).toBeChecked();
      await expect(
        page.getByRole('switch', { name: 'Allow Prize Selection' })
      ).toBeChecked();

      await openSavedStep(page, url, 'Prizes');
      await expect(page.getByRole('main').getByText(/^Prize \d$/)).toHaveText([
        'Prize 1',
        'Prize 2'
      ]);
      for (const [index, prize] of PRIZES.entries()) {
        await page.getByText(`Prize ${index + 1}`, { exact: true }).click();
        await expect(
          page.getByRole('textbox', { name: 'Prize name' }).nth(index)
        ).toHaveValue(prize.name);
        await expect(
          page.getByRole('spinbutton', { name: 'Winners' }).nth(index)
        ).toHaveValue(prize.winners);
      }

      await openSavedStep(page, url, 'Design');
      await expect(
        page.getByRole('switch', { name: 'Display Description' })
      ).not.toBeChecked();
      await expect(
        page.getByRole('combobox', { name: 'Background' })
      ).toHaveText('Gradient');
    }
  );
});
