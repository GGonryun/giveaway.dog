import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { expectAfterReloads } from '../../helpers/poll';
import {
  captureServerAction,
  readActionResult,
  replaceInArgs,
  replayServerAction,
  type ServerAction
} from '../../helpers/rsc';
import {
  seedApi,
  seedWorkerTeam,
  type SeededSweepstakes
} from '../../helpers/seed';
import {
  eligibleEntries,
  endedGiveaway,
  entriesPage,
  entryRow,
  openWinnerMenu,
  participantRow,
  participantsPage,
  personaName,
  presentationPage,
  readCompletions,
  readDraws,
  winnersPage
} from '../../helpers/winners';

const withWinner = (ns: string, team: string, preset: 'ended' | 'completed') =>
  endedGiveaway({
    ns,
    team,
    preset,
    prizes: [{ name: 'Golden Bone', quota: 2 }],
    entries: eligibleEntries(['participant', 'participant2']),
    draws: [{ entry: 0, prize: 0 }]
  });

const captureWinnerChanges = async (
  page: Page,
  team: string,
  giveaway: SeededSweepstakes
): Promise<Record<string, ServerAction>> => {
  await page.goto(entriesPage(team, giveaway.id));
  const deleteEntry = await captureServerAction(
    page,
    async () => {
      await entryRow(page, 'participant')
        .getByRole('button', { name: 'Entry actions' })
        .click();
      await page.getByRole('menuitem', { name: 'Delete Entry' }).click();
      await page
        .getByRole('dialog', { name: 'Delete Entry' })
        .getByRole('button', { name: 'Delete Entry' })
        .click();
    },
    { abort: true }
  );

  await page.goto(participantsPage(team, giveaway.id));
  const disqualifyParticipant = await captureServerAction(
    page,
    async () => {
      await participantRow(page, 'participant')
        .getByRole('button', { name: 'Participant actions' })
        .click();
      await page
        .getByRole('menuitem', { name: 'Disqualify Participant' })
        .click();
      const dialog = page.getByRole('dialog', {
        name: 'Disqualify Participant'
      });
      await dialog
        .getByLabel('Disqualification Reason (required)')
        .fill('Changed my mind');
      await dialog
        .getByRole('button', { name: 'Disqualify Participant' })
        .click();
    },
    { abort: true }
  );

  await page.goto(winnersPage(team, giveaway.id));
  const disqualifyWinner = await captureServerAction(
    page,
    async () => {
      await openWinnerMenu(page, personaName('participant'));
      await page.getByRole('menuitem', { name: 'Disqualify' }).click();
      const dialog = page.getByRole('dialog');
      await dialog
        .getByLabel('Disqualification Reason *')
        .fill('Changed my mind');
      await dialog
        .getByRole('button', { name: 'Disqualify', exact: true })
        .click();
    },
    { abort: true }
  );

  await page.goto(winnersPage(team, giveaway.id));
  const rerollWinner = await captureServerAction(
    page,
    async () => {
      await openWinnerMenu(page, personaName('participant'));
      await page.getByRole('menuitem', { name: 'Re-roll' }).click();
      const dialog = page.getByRole('dialog');
      await dialog
        .getByLabel('Disqualification Reason *')
        .fill('Changed my mind');
      await dialog
        .getByRole('button', { name: 'Disqualify & Re-roll', exact: true })
        .click();
    },
    { abort: true }
  );

  await page.goto(winnersPage(team, giveaway.id));
  const pickWinners = await captureServerAction(
    page,
    () => page.getByRole('button', { name: 'Pick Remaining Winners' }).click(),
    { abort: true }
  );

  await page.goto(winnersPage(team, giveaway.id));
  const updateCriteria = await captureServerAction(
    page,
    async () => {
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await page
        .getByRole('dialog', { name: 'Edit Winner Selection Criteria' })
        .getByRole('button', { name: 'Save Changes' })
        .click();
    },
    { abort: true }
  );

  return {
    deleteEntry,
    disqualifyParticipant,
    disqualifyWinner,
    rerollWinner,
    pickWinners,
    updateCriteria
  };
};

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

test.describe('the winners of a completed giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('the host cannot change the entries, the winners or the criteria of a completed giveaway', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const open = await seedApi(request).sweepstakes(
      withWinner(ns, team.slug, 'ended')
    );
    const completed = await seedApi(request).sweepstakes(
      withWinner(ns, team.slug, 'completed')
    );
    const actions = await captureWinnerChanges(page, team.slug, open);
    const replacements = {
      [open.id]: completed.id,
      [open.entries[0].participantId]: completed.entries[0].participantId,
      [open.entries[0].completions[0].id]:
        completed.entries[0].completions[0].id,
      [open.draws[0].id]: completed.draws[0].id
    };
    const before = {
      completions: await readCompletions(request, completed.id),
      draws: await readDraws(request, completed.id)
    };

    for (const [name, action] of Object.entries(actions)) {
      const [input] = replaceInArgs(
        action.args,
        Object.fromEntries(
          Object.entries(replacements).filter(([from]) =>
            JSON.stringify(action.args).includes(JSON.stringify(from))
          )
        )
      ) as [Record<string, unknown>];
      const args =
        name === 'updateCriteria'
          ? [{ ...input, minTasksCompleted: 5 }]
          : [input];
      expect(
        readActionResult(await replayServerAction(page, action, args)),
        name
      ).toMatchObject({
        ok: false,
        data: {
          code: 'FORBIDDEN',
          message: 'Completed sweepstakes cannot be modified.'
        }
      });
    }

    expect(await readCompletions(request, completed.id)).toEqual(
      before.completions
    );
    expect(await readDraws(request, completed.id)).toEqual(before.draws);
    await page.goto(winnersPage(team.slug, completed.id));
    await expect(page.getByText('Min Tasks:').locator('..')).toHaveText(
      'Min Tasks:1'
    );
    await expect(
      page.getByRole('button', { name: 'Edit', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Pick Remaining Winners' })
    ).toBeDisabled();
    await expectAfterReloads(page, async () => {
      await expect(
        page.getByRole('button', { name: 'Winner actions', exact: true })
      ).toBeDisabled();
    });

    await page.goto(entriesPage(team.slug, completed.id));
    await expect(entryRow(page, 'participant')).toContainText('Completed');
    await expect(
      page.getByRole('button', { name: 'Entry actions' })
    ).toHaveCount(0);

    await page.goto(presentationPage(team.slug, completed.id));
    const draw = page.getByRole('button', { name: 'Draw All Winners' });
    if (await draw.isEnabled()) {
      await draw.click();
      await expect(
        page.getByRole('button', {
          name: /Draw All Winners|Return to Sweepstakes/
        })
      ).toBeVisible({ timeout: 15_000 });
    }
    expect(await readDraws(request, completed.id)).toEqual(before.draws);

    await page.goto(participantsPage(team.slug, completed.id));
    await participantRow(page, 'participant')
      .getByRole('button', { name: 'Participant actions' })
      .click();
    await expect(
      page.getByRole('menuitem', { name: 'Quick View' })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Disqualify Participant' })
    ).toHaveCount(0);
  });
});
