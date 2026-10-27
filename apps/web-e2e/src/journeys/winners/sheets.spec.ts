import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  drawRow,
  endedGiveaway,
  entriesPage,
  entryRow,
  participantRow,
  participantsPage,
  personaName,
  winnersPage
} from '../../helpers/winners';

const TASK = 'Shake a paw';

const sheet = (page: Page) => page.getByRole('dialog');

const seedWithWinner = (
  request: Parameters<typeof seedApi>[0],
  ns: string,
  team: string
) =>
  seedApi(request).sweepstakes(
    endedGiveaway({
      ns,
      team,
      tasks: [{ type: 'BONUS_TASK', title: TASK }],
      entries: [
        { persona: 'participant', completions: [{ task: 0 }], quality: 100 }
      ],
      draws: [{ entry: 0, prize: 0 }]
    })
  );

const expectOpenAfterReload = async (page: Page, text: string) => {
  await expect(sheet(page)).toContainText(text);
  await page.reload();
  await expect(sheet(page)).toContainText(text);
};

const closeWithX = async (page: Page, list: string) => {
  await sheet(page).getByRole('button', { name: 'Close', exact: true }).click();
  await expect(sheet(page)).toBeHidden();
  await expect(page).toHaveURL(new RegExp(`${list}$`));
};

test.describe('the entry, participant and winner sheets', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('the host opens the entry and participant sheets from the lists, reloads them and closes them', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedWithWinner(request, ns, team.slug);
    const [entry] = giveaway.entries;
    const entries = entriesPage(team.slug, giveaway.id);
    const participants = participantsPage(team.slug, giveaway.id);

    await page.goto(entries);
    await entryRow(page, 'participant')
      .getByRole('button', { name: TASK })
      .click();
    await expect(page).toHaveURL(
      `${entries}/task/${giveaway.tasks[0].id}?active=${entry.completions[0].id}`,
      { timeout: 30_000 }
    );
    await expectOpenAfterReload(page, TASK);
    await closeWithX(page, entries);

    await page.goto(participants);
    await participantRow(page, 'participant')
      .getByText(personaName('participant'), { exact: true })
      .click();
    await expect(page).toHaveURL(`${participants}/${entry.userId}`, {
      timeout: 30_000
    });
    await expectOpenAfterReload(page, personaName('participant'));
    await closeWithX(page, participants);
  });

  test(
    '"Close Details" of an entry sheet opened by a direct link goes back to the list',
    knownBug(578),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const ns = freshNamespace(testInfo.workerIndex);
      const giveaway = await seedWithWinner(request, ns, team.slug);
      const entries = entriesPage(team.slug, giveaway.id);

      await page.goto(
        `${entries}/task/${giveaway.tasks[0].id}?active=${giveaway.entries[0].completions[0].id}`
      );
      await expect(sheet(page)).toContainText(TASK);
      await sheet(page).getByRole('button', { name: 'Close Details' }).click();
      await expect(sheet(page)).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`${entries}$`));
    }
  );

  test('the host opens the sheet of a winner from the Winners tab and reloads it', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedWithWinner(request, ns, team.slug);
    const winners = winnersPage(team.slug, giveaway.id);

    await page.goto(winners);
    await drawRow(page, personaName('participant'))
      .getByRole('button', { name: new RegExp(personaName('participant')) })
      .click();
    await expect(page).toHaveURL(
      `${winners}/user/${giveaway.entries[0].userId}`,
      { timeout: 30_000 }
    );
    await expectOpenAfterReload(page, personaName('participant'));
    await closeWithX(page, winners);
  });
});
