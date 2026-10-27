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

const CHOSEN = 'Golden Bone';

const OTHER = 'Silver Leash';

test.describe('drawing winners when participants choose their prize', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('[DRAW-009][DRAW-002] only a participant who chose a prize wins it, until the host turns prize selection off', async ({
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
          { name: CHOSEN, quota: 1 },
          { name: OTHER, quota: 1 }
        ],
        criteria: {
          minQualityScore: 50,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: true
        },
        entries: [
          {
            persona: 'participant',
            completions: [{ task: 0 }],
            quality: 100,
            prize: 0
          },
          { persona: 'participant2', completions: [{ task: 0 }], quality: 100 }
        ]
      })
    );
    const [chooser, other] = giveaway.entries;
    const [chosen, unchosen] = giveaway.prizes;

    await page.goto(winnersPage(team.slug, giveaway.id));
    await page.getByRole('button', { name: 'Pick All Winners' }).click();
    await expect(page.getByText('1 prize incomplete')).toBeVisible({
      timeout: 20_000
    });
    await expect(page.getByText(/^\d+ \/ \d+ winners? selected$/)).toHaveText([
      '1 / 1 winner selected',
      '0 / 1 winner selected'
    ]);
    await expect(drawRow(page, personaName('participant'))).toContainText(
      'Winner'
    );
    await expect(drawRow(page, personaName('participant2'))).toHaveCount(0);
    await expect(page.getByText('No draws yet for this prize')).toBeVisible();
    expect((await readDraws(request, giveaway.id)).draws).toEqual([
      expect.objectContaining({
        prizeId: chosen.id,
        userId: chooser.userId,
        result: 'WINNER'
      })
    ]);

    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    const dialog = page.getByRole('dialog', {
      name: 'Edit Winner Selection Criteria'
    });
    await dialog
      .getByRole('switch', { name: 'Allow participants to select prizes' })
      .click();
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(
      page
        .getByText('Prize Selection:', { exact: true })
        .locator('..')
        .filter({ visible: true })
    ).toHaveText('Prize Selection:No');

    await page.getByRole('button', { name: 'Pick Remaining Winners' }).click();
    await expect(
      page.getByText('All winners selected', { exact: true })
    ).toBeVisible({ timeout: 20_000 });
    await expect(drawRow(page, personaName('participant2'))).toContainText(
      'Winner'
    );

    const { draws } = await readDraws(request, giveaway.id);
    expect(draws).toHaveLength(2);
    expect(draws).toContainEqual(
      expect.objectContaining({
        prizeId: unchosen.id,
        userId: other.userId,
        result: 'WINNER'
      })
    );
  });
});
