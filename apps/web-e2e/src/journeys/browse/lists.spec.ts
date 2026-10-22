import type { APIRequestContext, Page, TestInfo } from '@playwright/test';
import type { E2eSweepstakesRequestInput } from '@giveaway/e2e-model/requests';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { seedSweepstakes } from '../../helpers/jobs';
import { knownBug } from '../../helpers/known-bug';
import { freshSlug, seedApi, seedWorkerTeam } from '../../helpers/seed';

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const OVER_A_DAY_AGO = -(DAY + 2 * HOUR);

type Giveaway = Omit<E2eSweepstakesRequestInput, 'ns' | 'team' | 'name'>;

const GIVEAWAYS = {
  running: { preset: 'running' },
  startsSoon: { preset: 'scheduled', startsIn: 2 * HOUR },
  startsLater: { preset: 'scheduled', startsIn: 3 * DAY },
  endedRecently: { preset: 'ended', endsIn: -2 * HOUR },
  endedLongAgo: { preset: 'ended', endsIn: OVER_A_DAY_AGO },
  unlisted: { preset: 'running', visibility: 'UNLISTED' },
  private: { preset: 'running', visibility: 'PRIVATE' },
  draftRunning: { preset: 'draft', startsIn: -HOUR, endsIn: 7 * DAY },
  completedRecently: { preset: 'completed', endsIn: -2 * HOUR },
  completedLongAgo: { preset: 'completed', endsIn: OVER_A_DAY_AGO },
  draftEnded: {
    preset: 'draft',
    startsIn: OVER_A_DAY_AGO - 7 * DAY,
    endsIn: OVER_A_DAY_AGO
  }
} satisfies Record<string, Giveaway>;

type Kind = keyof typeof GIVEAWAYS;

const seedGiveaways = async (
  request: APIRequestContext,
  testInfo: TestInfo,
  kinds: Kind[]
) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  const token = freshSlug(testInfo);
  const giveaways: Partial<
    Record<Kind, Awaited<ReturnType<typeof seedSweepstakes>>>
  > = {};
  for (const kind of kinds) {
    giveaways[kind] = await seedSweepstakes(request, {
      visibility: 'PUBLIC',
      ...GIVEAWAYS[kind],
      ns: RUN_ID,
      team: team.slug,
      name: `${token} ${kind}`
    });
  }
  return { token, giveaways };
};

const cards = (page: Page) =>
  page
    .getByRole('main')
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { level: 3 }) });

const cardOf = (page: Page, name: string) =>
  cards(page).filter({
    has: page.getByRole('heading', { level: 3, name, exact: true })
  });

const kindsOnPage = async (page: Page, token: string) => {
  const names = await cards(page)
    .getByRole('heading', { level: 3 })
    .allTextContents();
  return names
    .map((name) => name.match(new RegExp(`${token} (\\w+)$`))?.[1])
    .filter((kind) => kind !== undefined)
    .sort();
};

test.describe('the public giveaway lists', { tag: '@slow' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test.beforeEach(async ({ request }) => {
    const health = await seedApi(request).health();
    test.skip(
      !health?.allowPublic,
      'Set E2E_ALLOW_PUBLIC=1 on the deployment to seed PUBLIC giveaways'
    );
  });

  test('[VIS-001] /browse shows exactly the open, upcoming and recently ended public giveaways', async ({
    page,
    request
  }, testInfo) => {
    const { token, giveaways } = await seedGiveaways(
      request,
      testInfo,
      Object.keys(GIVEAWAYS) as Kind[]
    );

    await page.goto(`/browse?search=${token}`);

    await expect(page.getByText('Showing 3 giveaways')).toBeVisible();
    expect(await kindsOnPage(page, token)).toEqual([
      'endedRecently',
      'running',
      'startsSoon'
    ]);

    const badges: [Kind, string][] = [
      ['running', 'New'],
      ['startsSoon', 'Upcoming'],
      ['endedRecently', 'Finished']
    ];
    for (const [kind, badge] of badges) {
      const giveaway = giveaways[kind]!;
      const card = cardOf(page, giveaway.name);
      await expect(card.getByText(badge, { exact: true })).toBeVisible();
      await expect(card).toHaveAttribute(
        'href',
        `/browse/${giveaway.slug ?? giveaway.id}`
      );
    }
  });

  test('/history shows the public giveaways that ended more than a day ago', async ({
    page,
    request
  }, testInfo) => {
    const { token } = await seedGiveaways(
      request,
      testInfo,
      (Object.keys(GIVEAWAYS) as Kind[]).filter((kind) => kind !== 'draftEnded')
    );

    await page.goto(`/history?search=${token}`);

    await expect(page.getByText('Showing 2 giveaways')).toBeVisible();
    expect(await kindsOnPage(page, token)).toEqual([
      'completedLongAgo',
      'endedLongAgo'
    ]);
  });

  test(
    '[VIS-001] /history does not show a draft giveaway',
    knownBug(473),
    async ({ page, request }, testInfo) => {
      const { token } = await seedGiveaways(request, testInfo, [
        'endedLongAgo',
        'draftEnded'
      ]);

      await page.goto(`/history?search=${token}`);

      await expect(page.getByText('Showing 1 giveaway')).toBeVisible();
      expect(await kindsOnPage(page, token)).toEqual(['endedLongAgo']);
    }
  );
});
