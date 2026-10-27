import type { Page } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  drawRow,
  endedGiveaway,
  entriesPage,
  entryRow,
  personaName,
  readCompletions,
  readDraws,
  winnersPage
} from '../../helpers/winners';

const REJECT_REASON = 'The proof is a screenshot of another account';

const openVerifyDialog = async (page: Page, persona: E2ePersona) => {
  await entryRow(page, persona)
    .getByRole('button', { name: 'Entry actions' })
    .click();
  await page.getByRole('menuitem', { name: 'Verify Entry' }).click();
  const dialog = page.getByRole('dialog', { name: /Review Bonus Task/ });
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe('reviewing the entries of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('the host approves a pending entry and rejects a winning entry, which disqualifies its win', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        entries: [
          {
            persona: 'participant',
            completions: [{ task: 0, status: 'PENDING' }],
            quality: 100
          },
          {
            persona: 'participant2',
            completions: [{ task: 0 }],
            quality: 100
          }
        ],
        draws: [{ entry: 1, prize: 0 }]
      })
    );

    await page.goto(entriesPage(team.slug, giveaway.id));
    await expect(entryRow(page, 'participant')).toContainText('Pending Review');

    const approve = await openVerifyDialog(page, 'participant');
    await approve.getByRole('button', { name: 'Approve' }).click();
    await expect(
      page.getByText('Task completion status updated')
    ).toBeVisible();
    await expect(entryRow(page, 'participant')).toContainText('Completed');

    const reject = await openVerifyDialog(page, 'participant2');
    await expect(reject.getByLabel('Rejection Reason (required)')).toHaveCount(
      0
    );
    await reject.getByRole('button', { name: 'Reject' }).click();
    await reject.getByLabel('Rejection Reason (required)').fill(REJECT_REASON);
    await reject.getByRole('button', { name: 'Confirm Reject' }).click();
    await expect(reject).toBeHidden();
    await expect(entryRow(page, 'participant2')).toContainText('Rejected');

    await page.reload();
    await expect(entryRow(page, 'participant')).toContainText('Completed');
    await expect(entryRow(page, 'participant2')).toContainText('Rejected');

    const { completions } = await readCompletions(request, giveaway.id);
    const byUser = Object.fromEntries(
      completions.map((completion) => [completion.userId, completion])
    );
    const [approved, rejected] = giveaway.entries;
    expect(byUser[approved.userId]).toMatchObject({
      status: 'COMPLETED',
      reason: null
    });
    expect(byUser[rejected.userId]).toMatchObject({
      status: 'REJECTED',
      reason: REJECT_REASON
    });

    const { draws } = await readDraws(request, giveaway.id);
    expect(draws).toEqual([
      expect.objectContaining({
        result: 'DISQUALIFIED',
        disqualificationReason: `Entry rejected: ${REJECT_REASON}`
      })
    ]);

    await page.goto(winnersPage(team.slug, giveaway.id));
    await expect(drawRow(page, personaName('participant2'))).toContainText(
      'Disqualified'
    );
    await expect(
      page.getByText('0 / 1 winner selected', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pick All Winners' })
    ).toBeEnabled();
  });

  test('deleting the entry of a re-rolled winner keeps the winner that replaced them', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        entries: [
          {
            persona: 'participant',
            completions: [
              {
                task: 0,
                status: 'REJECTED',
                reason: 'Participant disqualified: No reply'
              }
            ],
            quality: 100
          },
          {
            persona: 'participant2',
            completions: [{ task: 0 }],
            quality: 100
          }
        ],
        draws: [
          {
            entry: 0,
            prize: 0,
            result: 'DISQUALIFIED',
            reason: 'No reply'
          },
          { entry: 1, prize: 0, previous: 0 }
        ]
      })
    );
    const replacement = giveaway.draws[1];

    await page.goto(entriesPage(team.slug, giveaway.id));
    await entryRow(page, 'participant')
      .getByRole('button', { name: 'Entry actions' })
      .click();
    await page.getByRole('menuitem', { name: 'Delete Entry' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete Entry' });
    await dialog.getByRole('button', { name: 'Delete Entry' }).click();
    await expect(dialog).toBeHidden();
    await expect(entryRow(page, 'participant')).toHaveCount(0);

    const { draws } = await readDraws(request, giveaway.id);
    expect(draws).toContainEqual(
      expect.objectContaining({ id: replacement.id, result: 'WINNER' })
    );

    await page.goto(winnersPage(team.slug, giveaway.id));
    await expect(drawRow(page, personaName('participant2'))).toContainText(
      'Winner'
    );
  });
});
