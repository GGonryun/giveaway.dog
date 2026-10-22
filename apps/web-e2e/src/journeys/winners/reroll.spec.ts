import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  drawRow,
  eligibleEntries,
  endedGiveaway,
  openWinnerMenu,
  personaName,
  readCompletions,
  readDraws,
  submitDisqualification,
  winnersPage
} from '../../helpers/winners';

const PERSONAS = ['participant', 'participant2', 'newbie', 'admin'] as const;

const REROLL_REASON = 'Did not answer the winner email';

const DISQUALIFY_REASON = 'Entered with a second account';

test.describe('disqualifying and re-rolling a winner', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('[DRAW-003] the host re-rolls a winner with a reason, then disqualifies another one and leaves the slot open', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        prizes: [{ name: 'Golden Bone', quota: 2 }],
        entries: eligibleEntries(PERSONAS),
        draws: [
          { entry: 0, prize: 0 },
          { entry: 1, prize: 0 }
        ]
      })
    );
    const [rerolled, disqualified, ...others] = giveaway.entries;
    const [rerolledDraw, disqualifiedDraw] = giveaway.draws;

    await page.goto(winnersPage(team.slug, giveaway.id));
    await expect(
      page.getByText('2 / 2 winners selected', { exact: true })
    ).toBeVisible();

    await openWinnerMenu(page, personaName('participant'));
    await page.getByRole('menuitem', { name: 'Re-roll' }).click();
    await expect(
      page.getByRole('heading', { name: 'Disqualify & Re-roll' })
    ).toBeVisible();
    await submitDisqualification(page, 'Disqualify & Re-roll', REROLL_REASON);

    await expect(drawRow(page, personaName('participant'))).toContainText(
      'Disqualified'
    );
    await expect(
      page.getByRole('button', { name: 'Winner actions', exact: true })
    ).toHaveCount(2);
    await expect(
      page.getByText('2 / 2 winners selected', { exact: true })
    ).toBeVisible();

    const afterReroll = await readDraws(request, giveaway.id);
    expect(afterReroll.byResult).toEqual({ WINNER: 2, DISQUALIFIED: 1 });
    expect(
      afterReroll.draws.find((draw) => draw.id === rerolledDraw.id)
    ).toMatchObject({
      result: 'DISQUALIFIED',
      disqualificationReason: REROLL_REASON
    });
    const replacement = afterReroll.draws.find(
      (draw) => draw.previousDrawId === rerolledDraw.id
    );
    expect(replacement?.result).toBe('WINNER');
    expect(others.map((entry) => entry.userId)).toContain(replacement?.userId);

    const { completions } = await readCompletions(request, giveaway.id);
    expect(completions.filter((c) => c.userId === rerolled.userId)).toEqual([
      expect.objectContaining({
        status: 'REJECTED',
        reason: `Participant disqualified: ${REROLL_REASON}`
      })
    ]);

    await openWinnerMenu(page, personaName('participant2'));
    await page.getByRole('menuitem', { name: 'Disqualify' }).click();
    await expect(
      page.getByRole('heading', { name: 'Disqualify User' })
    ).toBeVisible();
    await submitDisqualification(page, 'Disqualify', DISQUALIFY_REASON);

    await expect(drawRow(page, personaName('participant2'))).toContainText(
      'Disqualified'
    );
    await expect(
      page.getByText('1 / 2 winners selected', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pick Remaining Winners' })
    ).toBeEnabled();

    const afterDisqualify = await readDraws(request, giveaway.id);
    expect(afterDisqualify.byResult).toEqual({ WINNER: 1, DISQUALIFIED: 2 });
    expect(
      afterDisqualify.draws.find((draw) => draw.id === disqualifiedDraw.id)
    ).toMatchObject({
      result: 'DISQUALIFIED',
      disqualificationReason: DISQUALIFY_REASON,
      userId: disqualified.userId
    });

    await page.reload();
    await expect(
      page.getByText('1 / 2 winners selected', { exact: true })
    ).toBeVisible();
    for (const [persona, reason] of [
      ['participant', REROLL_REASON],
      ['participant2', DISQUALIFY_REASON]
    ] as const) {
      await drawRow(page, personaName(persona))
        .getByRole('button', { name: 'Disqualified winner actions' })
        .click();
      await page.getByRole('menuitem', { name: 'View Reason' }).click();
      const dialog = page.getByRole('dialog', {
        name: 'Disqualification Details'
      });
      await expect(dialog).toContainText(personaName(persona));
      await expect(dialog).toContainText(reason);
      await dialog.getByRole('button', { name: 'Close' }).first().click();
      await expect(dialog).toBeHidden();
    }
  });
});
