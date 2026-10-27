import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  drawRow,
  endedGiveaway,
  participantRow,
  participantsPage,
  personaName,
  readCompletions,
  readDraws,
  winnersPage
} from '../../helpers/winners';

const REASON = 'Entered with five accounts';

const DISQUALIFIED = `Participant disqualified: ${REASON}`;

test.describe('disqualifying a participant', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('[DRAW-005] the host disqualifies a participant, which rejects all their entries and their win', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        tasks: [{ type: 'BONUS_TASK' }, { type: 'BONUS_TASK' }],
        entries: [
          {
            persona: 'participant',
            completions: [{ task: 0 }, { task: 1, status: 'PENDING' }],
            quality: 100
          },
          {
            persona: 'participant2',
            completions: [{ task: 0 }],
            quality: 100
          }
        ],
        draws: [{ entry: 0, prize: 0 }]
      })
    );
    const [disqualified, other] = giveaway.entries;

    await page.goto(participantsPage(team.slug, giveaway.id));
    await participantRow(page, 'participant')
      .getByRole('button', { name: 'Participant actions' })
      .click();
    await page
      .getByRole('menuitem', { name: 'Disqualify Participant' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Disqualify Participant' });
    const confirm = dialog.getByRole('button', {
      name: 'Disqualify Participant'
    });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('Disqualification Reason (required)').fill('  ');
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel('Disqualification Reason (required)').fill(REASON);
    await expect(confirm).toBeEnabled();
    await confirm.click();
    await expect(dialog).toBeHidden();

    await expect
      .poll(async () => {
        const { completions } = await readCompletions(request, giveaway.id);
        return completions
          .filter((completion) => completion.userId === disqualified.userId)
          .map(({ status, reason }) => ({ status, reason }));
      })
      .toEqual([
        { status: 'REJECTED', reason: DISQUALIFIED },
        { status: 'REJECTED', reason: DISQUALIFIED }
      ]);
    const { completions } = await readCompletions(request, giveaway.id);
    expect(
      completions.filter((completion) => completion.userId === other.userId)
    ).toEqual([expect.objectContaining({ status: 'COMPLETED', reason: null })]);
    const { draws } = await readDraws(request, giveaway.id);
    expect(draws).toEqual([
      expect.objectContaining({
        userId: disqualified.userId,
        result: 'DISQUALIFIED',
        disqualificationReason: DISQUALIFIED
      })
    ]);

    await page.goto(winnersPage(team.slug, giveaway.id));
    await expect(drawRow(page, personaName('participant'))).toContainText(
      'Disqualified'
    );
    await expect(
      page.getByText('0 / 1 winner selected', { exact: true })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Pick All Winners' }).click();
    await expect(drawRow(page, personaName('participant2'))).toContainText(
      'Winner',
      { timeout: 20_000 }
    );
    expect((await readDraws(request, giveaway.id)).byResult).toEqual({
      WINNER: 1,
      DISQUALIFIED: 1
    });
  });
});
