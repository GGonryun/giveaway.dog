import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  drawRow,
  endedGiveaway,
  personaName,
  readDraws,
  winnersPage
} from '../../helpers/winners';

const criterion = (page: Page, name: string) =>
  page.getByText(`${name}:`, { exact: true }).locator('..');

const expectCriteria = async (
  page: Page,
  values: Record<
    'Min Tasks' | 'Min Quality' | 'Multiple Wins' | 'Eligible',
    string
  >
) => {
  for (const [name, value] of Object.entries(values)) {
    await expect(criterion(page, name)).toHaveText(`${name}:${value}`);
  }
};

const openCriteria = async (page: Page) => {
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: 'Edit Winner Selection Criteria'
  });
  await expect(dialog).toBeVisible();
  return dialog;
};

test.describe('the winner criteria of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('[ELIG-001][ELIG-002][DRAW-010] the host changes the criteria, which persist and decide who can win', async ({
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
        prizes: [
          { name: 'Golden Bone', quota: 1 },
          { name: 'Silver Leash', quota: 1 }
        ],
        criteria: {
          minQualityScore: 0,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: false
        },
        entries: [
          {
            persona: 'participant',
            completions: [{ task: 0 }, { task: 1 }],
            quality: 90
          },
          {
            persona: 'participant2',
            completions: [{ task: 0 }],
            quality: 90
          },
          {
            persona: 'newbie',
            completions: [{ task: 0 }, { task: 1 }],
            quality: 40
          }
        ]
      })
    );
    const [winner] = giveaway.entries;

    await page.goto(winnersPage(team.slug, giveaway.id));
    await expectCriteria(page, {
      'Min Tasks': '1',
      'Min Quality': '0%',
      'Multiple Wins': 'No',
      Eligible: '3 / 3'
    });

    let dialog = await openCriteria(page);
    const minTasks = dialog.getByLabel('Minimum Tasks Completed');
    await minTasks.fill('3');
    await dialog.getByRole('radio', { name: 'Moderate' }).click();
    await expect(dialog).toContainText(
      '0 of 3 participants meet these criteria'
    );
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expectCriteria(page, {
      'Min Tasks': '3',
      'Min Quality': '50%',
      'Multiple Wins': 'No',
      Eligible: '0 / 3'
    });
    await page.getByRole('button', { name: 'Pick All Winners' }).click();
    await expect(
      page.getByText('No eligible participants meet the criteria')
    ).toBeVisible({ timeout: 20_000 });
    expect((await readDraws(request, giveaway.id)).draws).toEqual([]);

    dialog = await openCriteria(page);
    await minTasks.fill('');
    await expect(minTasks).toHaveValue('1');
    await minTasks.fill('2');
    await dialog
      .getByRole('switch', { name: 'Allow users to win multiple prizes' })
      .click();
    await expect(dialog).toContainText(
      '1 of 3 participants meet these criteria'
    );
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await expectCriteria(page, {
      'Min Tasks': '2',
      'Min Quality': '50%',
      'Multiple Wins': 'Yes',
      Eligible: '1 / 3'
    });
    await page.getByRole('button', { name: 'Pick All Winners' }).click();
    await expect(
      page.getByText('All winners selected', { exact: true })
    ).toBeVisible({ timeout: 20_000 });
    await expect(drawRow(page, personaName('participant'))).toHaveCount(2);
    for (const persona of ['participant2', 'newbie'] as const) {
      await expect(drawRow(page, personaName(persona))).toHaveCount(0);
    }

    const { draws } = await readDraws(request, giveaway.id);
    expect(draws.map((draw) => draw.userId)).toEqual([
      winner.userId,
      winner.userId
    ]);
    expect(new Set(draws.map((draw) => draw.prizeId)).size).toBe(2);
  });
});
