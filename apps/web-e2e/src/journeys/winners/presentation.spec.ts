import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { openAs } from '../../helpers/teams';
import {
  ELIGIBLE_PERSONAS,
  eligibleEntries,
  endedGiveaway,
  readDraws
} from '../../helpers/winners';

const presentationPage = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/winners/public`;

test.describe('the winner draw presentation page', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    allowedPageErrors: [/ClientFetchError/]
  });

  test('only a member of the team opens the presentation page', async ({
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
        entries: eligibleEntries(ELIGIBLE_PERSONAS)
      })
    );
    const path = presentationPage(team.slug, giveaway.id);

    for (const [persona, redirect] of [
      [null, /\/login\?/],
      ['participant', /\/browse$/],
      ['host2', /\/app$/]
    ] as const) {
      const other = await openAs(browser, persona, RUN_ID);
      try {
        await other.page.goto(path);
        await expect(other.page, `${persona ?? 'a visitor'}`).toHaveURL(
          redirect
        );
        await expect(
          other.page.getByText(giveaway.name, { exact: true })
        ).toHaveCount(0);
      } finally {
        await other.context.close();
      }
    }

    await page.goto(path);
    await expect(
      page.getByRole('heading', { name: giveaway.name })
    ).toBeVisible();
    await expect(page.getByText(/^\d+ eligible participants?$/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Draw All Winners' })
    ).toBeEnabled();
    expect((await readDraws(request, giveaway.id)).draws).toEqual([]);
  });

  test(
    'the host cannot draw the winners of a running giveaway from the presentation page',
    knownBug(483),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const ns = freshNamespace(testInfo.workerIndex);
      const giveaway = await seedApi(request).sweepstakes({
        ...endedGiveaway({ ns, team: team.slug }),
        preset: 'running',
        entries: eligibleEntries(ELIGIBLE_PERSONAS)
      });

      await page.goto(presentationPage(team.slug, giveaway.id));
      await expect(
        page.getByRole('heading', { name: giveaway.name })
      ).toBeVisible();
      const draw = page.getByRole('button', { name: 'Draw All Winners' });
      if (await draw.isEnabled()) {
        await draw.click();
        await expect(
          page.getByRole('button', {
            name: /Draw All Winners|Return to Sweepstakes/
          })
        ).toBeVisible({ timeout: 15_000 });
      }

      expect((await readDraws(request, giveaway.id)).draws).toEqual([]);
    }
  );
});
