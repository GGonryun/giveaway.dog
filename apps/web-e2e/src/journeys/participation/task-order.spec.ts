import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import {
  captureServerAction,
  readActionResult,
  replayServerAction
} from '../../helpers/rsc';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const REQUIRED = 'Follow the house rules';
const OPTIONAL = 'Tell us about your setup';
const DEPENDENT = 'Unlock the loyal fan bonus';

const expectEntries = async (
  page: Page,
  path: string,
  entries: number,
  completed: number
) => {
  await page.goto(path);
  await expect(page.getByText(`Your entries: ${entries}`)).toBeVisible();
  await expect(page.getByText(`${completed}/3 completed`)).toBeVisible();
};

test.describe('required and dependent tasks', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ allowedPageErrors: [/Failed to load resource: net::ERR_FAILED/] });

  test(
    'a participant completes the required task before the optional and the dependent ones',
    { tag: '@slow' },
    async ({ page, request, freshPersona }, testInfo) => {
      const { ns } = await freshPersona('participant');
      await seedApi(request).userExtras({
        ns: RUN_ID,
        users: [
          { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
        ]
      });
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug,
        audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
        tasks: [
          { type: 'BONUS_TASK', title: REQUIRED, mandatory: true },
          {
            type: 'ASK_QUESTION',
            title: OPTIONAL,
            question: 'Which keyboard do you use?',
            value: 2
          },
          { type: 'BONUS_TASK', title: DEPENDENT, value: 3, tasksRequired: 2 }
        ]
      });
      const optional = giveaway.tasks.find((task) => task.title === OPTIONAL)!;

      const path = `/browse/${giveaway.id}`;

      await page.goto(path);
      await expect(page.getByText('Complete Required Tasks')).toBeVisible();
      await expect(
        page.getByText(
          'You must complete all required tasks to unlock 5 more entries'
        )
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: OPTIONAL })).toBeHidden();
      await expect(page.getByRole('heading', { name: DEPENDENT })).toBeHidden();

      await test.step('the server refuses the optional task before the required one', async () => {
        await page.getByRole('heading', { name: REQUIRED }).click();
        const action = await captureServerAction(
          page,
          () => page.getByRole('button', { name: 'Continue' }).click(),
          { abort: true }
        );

        const result = readActionResult(
          await replayServerAction(page, action, [
            {
              taskId: optional.id,
              sweepstakesId: giveaway.id,
              data: { answer: 'A split one' }
            }
          ])
        );

        expect(result.ok).toBe(false);
        expect(!result.ok && result.data.message).toBe(
          'You must complete all mandatory tasks before submitting this task.'
        );
        await expectEntries(page, path, 0, 0);
      });

      await test.step('the required task unlocks the others, and the dependent one waits for one more', async () => {
        await page.getByRole('heading', { name: REQUIRED }).click();
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page.getByText('Task completed!')).toBeVisible();
        await expectEntries(page, path, 1, 1);

        await expect(page.getByText('Complete Required Tasks')).toBeHidden();
        await page.getByRole('heading', { name: DEPENDENT }).click();
        await expect(
          page
            .getByRole('tabpanel', { name: 'Tasks' })
            .getByText('You must complete 1 other action first')
        ).toBeVisible();
      });

      await test.step('the optional task unlocks the dependent one', async () => {
        await page.goto(path);
        await page.getByRole('heading', { name: OPTIONAL }).click();
        await page.getByPlaceholder('Enter your answer...').fill('A split one');
        await page.getByRole('button', { name: 'Submit Answer' }).click();
        await expect(page.getByText('Task completed!')).toBeVisible();
        await expectEntries(page, path, 3, 2);

        await page.getByRole('heading', { name: DEPENDENT }).click();
        await page.getByRole('button', { name: 'Continue' }).click();
        await expect(page.getByText('Task completed!')).toBeVisible();
        await expectEntries(page, path, 6, 3);
      });
    }
  );
});
