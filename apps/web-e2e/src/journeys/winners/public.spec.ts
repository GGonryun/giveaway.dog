import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { expectAfterReloads } from '../../helpers/poll';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { openAs } from '../../helpers/teams';
import {
  eligibleEntries,
  endedGiveaway,
  personaName,
  winnersPage
} from '../../helpers/winners';

const PRIZE = 'Golden Bone';

const DISQUALIFY_REASON = 'Bot account';

const taskTitle = (task: unknown) => (task as { title: string }).title;

const winnersAnnounced = (page: Page) =>
  page.getByRole('heading', { name: 'Winners Announced!' });

test.describe('the winners on the public giveaway page', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('a visitor sees the winners once the host draws them and completes the giveaway', async ({
    browser,
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        prizes: [{ name: PRIZE, quota: 1 }],
        entries: eligibleEntries(['participant'])
      })
    );

    const visitor = await openAs(browser, null, ns);
    try {
      await visitor.page.goto(`/browse/${giveaway.id}`);
      await expect(
        visitor.page.getByText('Winners Being Selected')
      ).toBeVisible();

      await page.goto(winnersPage(team.slug, giveaway.id));
      await page.getByRole('button', { name: 'Pick All Winners' }).click();
      await expect(
        page.getByText('All winners selected', { exact: true })
      ).toBeVisible();
      await page.getByRole('button', { name: 'Mark as Completed' }).click();
      await page
        .getByRole('button', { name: 'Yes, Complete Sweepstakes' })
        .click();
      await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
        timeout: 30_000
      });

      await visitor.page.reload();
      await expectAfterReloads(visitor.page, () =>
        expect(winnersAnnounced(visitor.page)).toBeVisible({
          timeout: 2_000
        })
      );
      await visitor.page
        .getByRole('button', { name: new RegExp(PRIZE) })
        .click();
      await expect(
        visitor.page.getByText('1 winner', { exact: true })
      ).toBeVisible();
      await expect(
        visitor.page
          .getByRole('row')
          .filter({ hasText: personaName('participant') })
      ).toContainText(taskTitle(giveaway.tasks[0]));
    } finally {
      await visitor.context.close();
    }
  });

  test('the winner, a loser and a visitor see the result of a completed giveaway with prize selection', async ({
    browser,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        preset: 'completed',
        prizes: [{ name: PRIZE, quota: 1 }],
        criteria: {
          minQualityScore: 50,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: true
        },
        entries: eligibleEntries(['participant', 'participant2', 'newbie']).map(
          (entry) => ({ ...entry, prize: 0 })
        ),
        draws: [
          {
            entry: 2,
            prize: 0,
            result: 'DISQUALIFIED',
            reason: DISQUALIFY_REASON
          },
          { entry: 0, prize: 0, previous: 0 }
        ]
      })
    );
    const title = taskTitle(giveaway.tasks[0]);

    const visitor = await openAs(browser, null, ns);
    const winner = await openAs(browser, 'participant', ns);
    const loser = await openAs(browser, 'participant2', ns);
    try {
      await visitor.page.goto(`/browse/${giveaway.id}`);
      await expect(winnersAnnounced(visitor.page)).toBeVisible();
      await visitor.page
        .getByRole('button', { name: new RegExp(PRIZE) })
        .click();
      await expect(
        visitor.page.getByText('1 winner', { exact: true })
      ).toBeVisible();
      await expect(
        visitor.page.getByText('1 disqualified', { exact: true })
      ).toBeVisible();
      await expect(
        visitor.page
          .getByRole('row')
          .filter({ hasText: personaName('participant') })
      ).toContainText(`${title}Winner`);
      await visitor.page
        .getByRole('row')
        .filter({ hasText: personaName('newbie') })
        .getByRole('button', { name: 'Disqualified' })
        .click();
      const dialog = visitor.page.getByRole('dialog', {
        name: 'Disqualification Details'
      });
      await expect(dialog).toContainText(personaName('newbie'));
      await expect(dialog).toContainText(DISQUALIFY_REASON);

      await winner.page.goto(`/browse/${giveaway.id}`);
      await expect(
        winner.page.getByText(`Congratulations! You won ${PRIZE}!`)
      ).toBeVisible();

      await loser.page.goto(`/browse/${giveaway.id}`);
      await expect(
        loser.page.getByText(`You competed for ${PRIZE}`)
      ).toBeVisible();
      await expect(
        loser.page.getByText("Unfortunately, you didn't win this time.")
      ).toBeVisible();
    } finally {
      await Promise.all(
        [visitor, winner, loser].map(({ context }) => context.close())
      );
    }
  });

  test(
    'the winner of a completed giveaway without prize selection sees that they won',
    knownBug(587),
    async ({ browser, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const ns = freshNamespace(testInfo.workerIndex);
      const giveaway = await seedApi(request).sweepstakes(
        endedGiveaway({
          ns,
          team: team.slug,
          preset: 'completed',
          prizes: [{ name: PRIZE, quota: 1 }],
          entries: eligibleEntries(['participant', 'participant2']),
          draws: [{ entry: 0, prize: 0 }]
        })
      );

      const winner = await openAs(browser, 'participant', ns);
      try {
        await winner.page.goto(`/browse/${giveaway.id}`);
        await expect(winnersAnnounced(winner.page)).toBeVisible();
        await expect(
          winner.page.getByText(`Congratulations! You won ${PRIZE}!`)
        ).toBeVisible();
      } finally {
        await winner.context.close();
      }
    }
  );
});
