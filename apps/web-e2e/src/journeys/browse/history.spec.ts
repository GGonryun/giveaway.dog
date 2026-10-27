import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import {
  cardLabels,
  DAY,
  giveawayCard,
  HOUR,
  noGiveaways,
  requirePublicSeeds
} from '../../helpers/browse';
import { seedSweepstakes } from '../../helpers/jobs';
import { knownBug } from '../../helpers/known-bug';
import { freshSlug, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const ENDED_LONG_AGO = -(DAY + 2 * HOUR);

const searchBox = (page: Page) =>
  page.getByRole('searchbox', {
    name: 'Search giveaways by name or description...'
  });

const search = async (page: Page, query: string) => {
  await searchBox(page).fill(query);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('search'))
    .toBe(query);
};

test.describe('the search of /history', { tag: TAGS.slow }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.beforeEach(({ request }) => requirePublicSeeds(request));

  test('a visitor searches /history and clears the search', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const token = freshSlug(testInfo);
    await seedSweepstakes(request, {
      ns: RUN_ID,
      team: team.slug,
      preset: 'ended',
      visibility: 'PUBLIC',
      endsIn: ENDED_LONG_AGO,
      name: `${token} ended`
    });

    await page.goto('/history');
    await expect(
      page.getByRole('heading', { name: 'Giveaway History' })
    ).toBeVisible();

    await search(page, token);
    await expect(page.getByText('Showing 1 giveaway')).toBeVisible();
    expect(await cardLabels(page, token)).toEqual(['ended']);

    await search(page, `${token}x`);
    await expect(noGiveaways(page)).toBeVisible();

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page).toHaveURL(/\/history$/);
  });

  test(
    'a search finds a giveaway that ended before the 20 most recent ones',
    knownBug(563),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const token = freshSlug(testInfo);
      const older = await seedSweepstakes(request, {
        ns: RUN_ID,
        team: team.slug,
        preset: 'ended',
        visibility: 'PUBLIC',
        endsIn: ENDED_LONG_AGO - DAY,
        name: `${token} older`
      });
      for (let index = 0; index < 20; index++) {
        await seedSweepstakes(request, {
          ns: RUN_ID,
          team: team.slug,
          preset: 'ended',
          visibility: 'PUBLIC',
          endsIn: ENDED_LONG_AGO,
          name: `${freshSlug(testInfo)} newer`
        });
      }

      await page.goto(`/history?search=${token}`);

      await expect(giveawayCard(page, older.name)).toBeVisible();
    }
  );
});
