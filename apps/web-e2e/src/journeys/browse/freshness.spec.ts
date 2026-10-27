import type { TestInfo } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState, RUN_ID } from '../../env';
import {
  cardLabels,
  DAY,
  filtersSheet,
  giveawayCard,
  hostOptions,
  noGiveaways,
  openFilters,
  requirePublicSeeds
} from '../../helpers/browse';
import {
  createDraft,
  fillComplete,
  openAsVisitor,
  openStep,
  publishNow
} from '../../helpers/editor';
import { seedSweepstakes } from '../../helpers/jobs';
import { knownBug } from '../../helpers/known-bug';
import { expectAfterReloads } from '../../helpers/poll';
import { freshSlug, seedApi } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const freshTeam = (
  request: Parameters<typeof seedApi>[0],
  testInfo: TestInfo
) =>
  seedApi(request).team({
    ns: RUN_ID,
    suffix: `h${freshNamespace(testInfo.workerIndex).slice(RUN_ID.length)}`
  });

test.describe('the browse lists after a change', { tag: TAGS.slow }, () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });
  test.beforeEach(({ request }) => requirePublicSeeds(request));

  test(
    'a public giveaway that a host publishes shows up in /browse with its host',
    knownBug(559),
    async ({ browser, page, request }, testInfo) => {
      const { team } = await freshTeam(request, testInfo);
      const token = freshSlug(testInfo);
      const name = `${token} published`;
      const visitor = await openAsVisitor(browser, `/browse?search=${token}`);
      try {
        await expect(noGiveaways(visitor.page)).toBeVisible();
        expect(await hostOptions(visitor.page)).not.toContain(team.name);

        await createDraft(page, team.slug);
        await fillComplete(page, { name });
        await openStep(page, 'Audience');
        await page.getByRole('combobox', { name: 'Visibility Type' }).click();
        await page.getByRole('option', { name: 'Public', exact: true }).click();
        await publishNow(page, team.slug, /go live immediately/);

        await visitor.page.reload();
        await expectAfterReloads(visitor.page, () =>
          expect(giveawayCard(visitor.page, name)).toBeVisible({
            timeout: 2_000
          })
        );
        expect(await hostOptions(visitor.page)).toContain(team.name);
      } finally {
        await visitor.context.close();
      }
    }
  );

  test('a visitor filters /browse by host, then clears the filters', async ({
    page,
    request
  }, testInfo) => {
    const token = freshSlug(testInfo);
    const teams = [
      (await freshTeam(request, testInfo)).team,
      (await freshTeam(request, testInfo)).team
    ];
    const seeds = [
      { team: teams[0], label: 'first' },
      { team: teams[0], label: 'second' },
      { team: teams[1], label: 'other' }
    ];
    for (const [index, { team, label }] of seeds.entries()) {
      await seedSweepstakes(request, {
        ns: RUN_ID,
        team: team.slug,
        visibility: 'PUBLIC',
        endsIn: (index + 2) * DAY,
        name: `${token} ${label}`,
        expireLists: index === seeds.length - 1
      });
    }

    await page.goto(`/browse?search=${token}`);
    await expect(page.getByText('Showing 3 giveaways')).toBeVisible();

    const sheet = await openFilters(page);
    await sheet.getByRole('button', { name: 'Hosts' }).click();
    await page.getByRole('option', { name: teams[0].name }).click();
    await page.keyboard.press('Escape');
    await sheet.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(filtersSheet(page)).toBeHidden();

    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get('hosts') === teams[0].slug &&
        url.searchParams.get('search') === token
    );
    await expect(page.getByText('Showing 2 giveaways')).toBeVisible();
    expect((await cardLabels(page, token)).sort()).toEqual(['first', 'second']);

    await (await openFilters(page))
      .getByRole('button', { name: 'Clear', exact: true })
      .click();
    await expect(page).toHaveURL(/\/browse$/);
  });
});
