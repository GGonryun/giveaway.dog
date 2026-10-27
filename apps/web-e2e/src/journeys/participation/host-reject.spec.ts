import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const QUESTION = 'Tell us about your setup';
const BONUS = 'Claim a free entry';
const REASON = 'The answer does not name a keyboard';

test.describe('the host rejects a submission', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('the host rejects an answer from the Entries tab, and the participant sees it', async ({
    page,
    request,
    browser,
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
        {
          type: 'ASK_QUESTION',
          title: QUESTION,
          question: 'Which keyboard do you use?',
          value: 2
        },
        { type: 'BONUS_TASK', title: BONUS }
      ]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await page.getByRole('heading', { name: QUESTION }).click();
    await page.getByPlaceholder('Enter your answer...').fill('Not telling');
    await page.getByRole('button', { name: 'Submit Answer' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();
    await page.reload();
    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();
    await page.reload();
    await expect(page.getByText('2/2 completed')).toBeVisible();

    const host = await browser.newContext({
      storageState: personaState('host')
    });
    const hostPage = await host.newPage();
    await hostPage.goto(`/app/${team.slug}/sweepstakes/${giveaway.id}/entries`);
    const row = hostPage.getByRole('row').filter({ hasText: QUESTION });
    await row.getByRole('button', { name: 'Entry actions' }).click();
    await hostPage.getByRole('menuitem', { name: 'Verify Entry' }).click();
    const dialog = hostPage.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Reject' }).click();
    await dialog.getByLabel('Rejection Reason (required)').fill(REASON);
    await dialog.getByRole('button', { name: 'Confirm Reject' }).click();
    await expect(dialog).toBeHidden();
    await expect(row.getByText('Rejected')).toBeVisible();
    await host.close();

    await page.mouse.move(0, 0);
    await page.reload();
    await expect(page.getByText('1/2 completed')).toBeVisible();
    await page.getByRole('heading', { name: QUESTION }).click();
    await expect(
      page.getByRole('tooltip', { name: 'Your submission was rejected.' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Submit Answer' })
    ).toBeHidden();
  });
});
