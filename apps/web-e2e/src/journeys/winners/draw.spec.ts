import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { waitForGiveawayState } from '../../helpers/jobs';
import { expectAfterReloads } from '../../helpers/poll';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  ELIGIBLE_PERSONAS,
  LOW_QUALITY_PERSONA,
  REJECTED_PERSONA,
  drawRow,
  eligibleEntries,
  endedGiveaway,
  personaName,
  readDraws,
  winnersPage
} from '../../helpers/winners';

const NOT_ENDED_ALERT = 'Winners Can Only Be Selected After Giveaway Ends';

const editGiveawayLink = (page: Page, details: string) =>
  page
    .getByRole('link', { name: 'Edit', exact: true })
    .and(page.locator(`[href="${details}/edit"]`));

test.describe('drawing the winners of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('[DRAW-002][DRAW-004][DRAW-005][ELIG-001] the host draws distinct eligible winners for every prize of an ended giveaway and completes it', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        prizes: [
          { name: 'Golden Bone', quota: 2 },
          { name: 'Silver Leash', quota: 1 }
        ],
        entries: [
          ...eligibleEntries(ELIGIBLE_PERSONAS),
          {
            persona: LOW_QUALITY_PERSONA,
            completions: [{ task: 0 }],
            quality: 0
          },
          {
            persona: REJECTED_PERSONA,
            completions: [{ task: 0, status: 'REJECTED', reason: 'Spam' }],
            quality: 100
          }
        ]
      })
    );
    const eligible = giveaway.entries
      .filter((entry) =>
        (ELIGIBLE_PERSONAS as readonly string[]).includes(entry.persona)
      )
      .map((entry) => entry.userId);
    const details = `/app/${team.slug}/sweepstakes/${giveaway.id}`;

    await page.goto(winnersPage(team.slug, giveaway.id));
    await expect(page.getByText(NOT_ENDED_ALERT)).toHaveCount(0);
    await page.getByRole('button', { name: 'Pick All Winners' }).click();
    await expect(
      page.getByText('All winners selected', { exact: true })
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByText('2 / 2 winners selected', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('1 / 1 winner selected', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Complete', { exact: true })).toHaveCount(2);
    for (const persona of ELIGIBLE_PERSONAS) {
      await expect(drawRow(page, personaName(persona))).toContainText('Winner');
    }
    for (const persona of [LOW_QUALITY_PERSONA, REJECTED_PERSONA] as const) {
      await expect(drawRow(page, personaName(persona))).toHaveCount(0);
    }

    const { byResult, draws } = await readDraws(request, giveaway.id);
    expect(byResult).toEqual({ WINNER: 3 });
    expect(draws.map((draw) => draw.userId).sort()).toEqual(
      [...eligible].sort()
    );

    await page.getByRole('button', { name: 'Mark as Completed' }).click();
    await page
      .getByRole('button', { name: 'Yes, Complete Sweepstakes' })
      .click();
    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
      timeout: 30_000
    });

    const row = page.getByRole('row').filter({ hasText: giveaway.name });
    await expect(row).toContainText('completed');
    await row.getByRole('button', { name: 'Giveaway actions' }).click();
    await expect(
      page.getByRole('menuitem', { name: 'View Details' })
    ).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.goto(`${details}/preview`);
    await waitForGiveawayState(page, 'completed');
    await expect(page.getByText('Sweepstakes Completed')).toBeVisible();
    await expect(editGiveawayLink(page, details)).toHaveCount(0);

    await page.goto(`${details}/edit`);
    await expect(
      page.getByText('Sweepstakes with status "COMPLETED" cannot be edited.')
    ).toBeVisible();

    await page.goto(winnersPage(team.slug, giveaway.id));
    const menus = page.getByRole('button', {
      name: 'Winner actions',
      exact: true
    });
    await expect(menus).toHaveCount(3);
    await expectAfterReloads(page, async () => {
      for (const menu of await menus.all()) {
        await expect(menu).toBeDisabled();
      }
    });

    expect((await readDraws(request, giveaway.id)).byResult).toEqual({
      WINNER: 3
    });
  });

  test('the host cannot draw the winners of a running giveaway from the Winners tab', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaway = await seedApi(request).sweepstakes({
      ...endedGiveaway({ ns, team: team.slug }),
      preset: 'running',
      entries: eligibleEntries(ELIGIBLE_PERSONAS)
    });

    await page.goto(winnersPage(team.slug, giveaway.id));
    await expect(
      editGiveawayLink(page, `/app/${team.slug}/sweepstakes/${giveaway.id}`)
    ).toBeVisible();
    await expect(page.getByText(NOT_ENDED_ALERT)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pick All Winners' })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Roll with public picker' })
    ).toBeDisabled();
  });
});
