import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  endedGiveaway,
  personaName,
  readCompletions,
  readDraws
} from '../../helpers/winners';

test.describe('a completed giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('the host cannot reject the winning entry of a completed giveaway', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        preset: 'completed',
        entries: [
          {
            persona: 'participant',
            completions: [{ task: 0 }],
            quality: 100
          }
        ],
        draws: [{ entry: 0, prize: 0 }]
      })
    );

    await page.goto(`/app/${team.slug}/sweepstakes/${giveaway.id}/entries`);
    const row = page.getByRole('row').filter({
      has: page.getByRole('button', {
        name: personaName('participant'),
        exact: true
      })
    });
    await expect(row).toContainText('Completed');
    const menu = row.getByRole('button', { name: 'Entry actions' });
    if ((await menu.count()) > 0 && (await menu.isEnabled())) {
      await menu.click();
      const verify = page.getByRole('menuitem', { name: 'Verify Entry' });
      if ((await verify.count()) > 0 && (await verify.isEnabled())) {
        await verify.click();
        const dialog = page.getByRole('dialog');
        const reject = dialog.getByRole('button', { name: 'Reject' });
        if (await reject.isEnabled()) {
          await reject.click();
          await dialog
            .getByLabel('Rejection Reason (required)')
            .fill('Changed my mind');
          await dialog.getByRole('button', { name: 'Confirm Reject' }).click();
          await expect(
            page.getByText(
              /Task completion status updated|Failed to update status/
            )
          ).toBeVisible();
        }
      }
    }

    const { byStatus } = await readCompletions(request, giveaway.id);
    expect(byStatus).toEqual({ COMPLETED: 1 });
    const { byResult } = await readDraws(request, giveaway.id);
    expect(byResult).toEqual({ WINNER: 1 });
  });
});
