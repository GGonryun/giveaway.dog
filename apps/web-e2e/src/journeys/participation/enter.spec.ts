import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BASE_URL, E2E_SECRET, RUN_ID, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const CODE = `E2E-${RUN_ID.toUpperCase()}`;

const TASKS = {
  code: 'Enter the code of the stream',
  question: 'Tell us about your setup',
  choice: 'Pick a side',
  visit: 'Read our terms',
  bonus: 'Claim a free entry',
  secondBonus: 'Claim another free entry'
};

const openTask = async (page: Page, title: string) => {
  await page.getByRole('heading', { name: title }).click();
};

const expectProgress = async (
  page: Page,
  entries: number,
  completed: number
) => {
  await expect(page.getByText(`Your entries: ${entries}`)).toBeVisible();
  await expect(page.getByText(`${completed}/5 completed`)).toBeVisible();
};

const expectCompleted = async (
  page: Page,
  entries: number,
  completed: number
) => {
  await expect(page.getByText('Task completed!').first()).toBeVisible();
  await expectProgress(page, entries, completed);
};

test.describe('entering a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test(
    '[ENTRY-001] a participant enters by completing tasks, and the entries persist',
    { tag: '@slow' },
    async ({ page, request, browser, freshPersona }, testInfo) => {
      const participant = await freshPersona('participant');
      await seedApi(request).userExtras({
        ns: RUN_ID,
        users: [
          {
            persona: 'participant',
            ns: participant.ns,
            accounts: [{ identity: 'GOOGLE' }]
          }
        ]
      });
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug,
        audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
        tasks: [
          {
            type: 'SECRET_CODE_V2',
            title: TASKS.code,
            codes: [CODE],
            caseSensitive: false,
            value: 2
          },
          {
            type: 'ASK_QUESTION',
            title: TASKS.question,
            question: 'Which keyboard do you use?'
          },
          {
            type: 'SINGLE_CHOICE',
            title: TASKS.choice,
            question: 'Cats or dogs?',
            options: ['Cats', 'Dogs']
          },
          {
            type: 'VISIT_URL',
            title: TASKS.visit,
            href: `${BASE_URL}/terms`,
            label: 'Open the terms',
            afterVisit: {
              type: 'QUESTION',
              question: 'What is the first word?',
              input: 'TEXT'
            }
          },
          { type: 'BONUS_TASK', title: TASKS.bonus }
        ]
      });

      await page.goto(`/browse/${giveaway.id}`);
      await expectProgress(page, 0, 0);

      await test.step('a wrong code is refused, and the code in lower case is accepted', async () => {
        await openTask(page, TASKS.code);
        const input = page.getByPlaceholder('Enter the secret code');
        await input.fill('wrong');
        await page.getByRole('button', { name: 'Submit Code' }).click();
        await expect(page.getByText('Invalid Code')).toBeVisible();
        await expectProgress(page, 0, 0);

        await input.fill(CODE.toLowerCase());
        await page.getByRole('button', { name: 'Submit Code' }).click();
        await expectCompleted(page, 2, 1);
      });

      await test.step('the question, the choice and the visit', async () => {
        await openTask(page, TASKS.question);
        await page.getByPlaceholder('Enter your answer...').fill('A split one');
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await expectCompleted(page, 3, 2);

        await openTask(page, TASKS.choice);
        await page.getByRole('radio', { name: 'Dogs' }).check();
        await page.getByRole('button', { name: 'Submit Choice' }).click();
        await expectCompleted(page, 4, 3);

        await openTask(page, TASKS.visit);
        const popup = page.waitForEvent('popup');
        await page.getByRole('link', { name: 'Open the terms' }).click();
        await (await popup).close();
        await page.getByLabel('What is the first word?').fill('Terms');
        await page.getByRole('button', { name: 'Complete Task' }).click();
        await expectCompleted(page, 5, 4);
      });

      const stale = await page.context().newPage();
      await stale.goto(`/browse/${giveaway.id}`);
      await expectProgress(stale, 5, 4);

      await test.step('the bonus', async () => {
        await openTask(page, TASKS.bonus);
        await page.getByRole('button', { name: 'Continue' }).click();
        await expectCompleted(page, 6, 5);
      });

      await test.step('a tab opened before the bonus cannot claim it again', async () => {
        await openTask(stale, TASKS.bonus);
        await stale.getByRole('button', { name: 'Continue' }).click();
        await expect(
          stale.getByText(
            'You have already completed this task. Refresh the page.'
          )
        ).toBeVisible();
        await stale.close();
      });

      await test.step('the entries persist after a reload', async () => {
        await page.reload();
        await expectProgress(page, 6, 5);
        await openTask(page, TASKS.question);
        await expect(
          page.getByText('You have already submitted your answer. Thank you!')
        ).toBeVisible();
      });

      await test.step('the host sees the participant with every task done', async () => {
        const host = await browser.newContext({
          storageState: personaState('host')
        });
        const hostPage = await host.newPage();
        await hostPage.goto(
          `/app/${team.slug}/sweepstakes/${giveaway.id}/participants`
        );
        await expect(
          hostPage.getByRole('row', { name: /^E2E participant .* 100% / })
        ).toBeVisible();
        await expect(
          hostPage.getByText('Showing 1-1 of 1 participants')
        ).toBeVisible();
        await host.close();
      });
    }
  );

  test('the entries update as soon as a task is completed', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    const participant = await freshPersona('participant');
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        {
          persona: 'participant',
          ns: participant.ns,
          accounts: [{ identity: 'GOOGLE' }]
        }
      ]
    });
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
      tasks: [
        { type: 'BONUS_TASK', title: TASKS.bonus },
        { type: 'BONUS_TASK', title: TASKS.secondBonus }
      ]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await openTask(page, TASKS.bonus);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Task completed!')).toBeVisible();
    await expect(page.getByText('Your entries: 1')).toBeVisible();
    await expect(page.getByText('1/2 completed')).toBeVisible();

    await openTask(page, TASKS.secondBonus);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Your entries: 2')).toBeVisible();
    await expect(page.getByText('2/2 completed')).toBeVisible();
  });
});
