import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  endedGiveaway,
  entriesPage,
  entryRow,
  readCompletions
} from '../../helpers/winners';

const CODE = 'GOOD-BOY-42';

test.describe('re-verifying an entry', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('the host re-verifies a secret-code entry with the right code and it stays completed', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        tasks: [{ type: 'SECRET_CODE', code: CODE }],
        entries: [
          {
            persona: 'participant',
            completions: [{ task: 0, proof: { code: CODE } }],
            quality: 100
          }
        ]
      })
    );

    await page.goto(entriesPage(team.slug, giveaway.id));
    const row = entryRow(page, 'participant');
    await expect(row).toContainText('Completed');
    await row.getByRole('button', { name: 'Entry actions' }).click();
    await page.getByRole('menuitem', { name: 'Verify Entry' }).click();
    const dialog = page.getByRole('dialog', { name: /Verify Secret Code/ });
    await dialog
      .getByRole('button', { name: 'Re-verify Automatically' })
      .click();
    await expect(
      page.getByText('Task completion re-verified successfully')
    ).toBeVisible();

    await page.reload();
    await expect(entryRow(page, 'participant')).toContainText('Completed');
    const { completions } = await readCompletions(request, giveaway.id);
    expect(completions).toEqual([
      expect.objectContaining({ status: 'COMPLETED', reason: null })
    ]);
  });
});
