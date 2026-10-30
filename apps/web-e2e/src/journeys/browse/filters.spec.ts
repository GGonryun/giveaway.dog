import type { APIRequestContext, Page, TestInfo } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import type { E2eSweepstakesRequestInput } from '@giveaway/e2e-model/requests';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, RUN_ID } from '../../env';
import {
  cardLabels,
  DAY,
  filtersSheet,
  giveawayCard,
  HOUR,
  noGiveaways,
  openFilters,
  requirePublicSeeds
} from '../../helpers/browse';
import { seedSweepstakes } from '../../helpers/jobs';
import { knownBug } from '../../helpers/known-bug';
import { freshSlug, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

type Giveaway = Omit<E2eSweepstakesRequestInput, 'ns' | 'team' | 'name'>;

const ENTRANTS: E2ePersona[] = ['participant', 'participant2', 'newbie'];

const entrants = (count: number, ns: string) =>
  ENTRANTS.slice(0, count).map((persona) => ({
    persona,
    ns,
    completions: [{ task: 0 }]
  }));

const seedGiveaways = async (
  request: APIRequestContext,
  testInfo: TestInfo,
  giveaways: [string, Giveaway][]
) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  const token = freshSlug(testInfo);
  const seeded: Record<
    string,
    Awaited<ReturnType<typeof seedSweepstakes>>
  > = {};
  for (const [label, giveaway] of giveaways) {
    seeded[label] = await seedSweepstakes(request, {
      visibility: 'PUBLIC',
      ...giveaway,
      ns: RUN_ID,
      team: team.slug,
      name: `${token} ${label}`
    });
  }
  return { token, seeded };
};

const applyFilters = async (page: Page) => {
  await filtersSheet(page)
    .getByRole('button', { name: 'Apply Filters' })
    .click();
  await expect(filtersSheet(page)).toBeHidden();
};

const sortBy = async (page: Page, sort: string) => {
  const sheet = await openFilters(page);
  await sheet.getByRole('combobox', { name: 'Sort By' }).click();
  await page.getByRole('option', { name: sort, exact: true }).click();
  await applyFilters(page);
};

const param = (page: Page, name: string) =>
  new URL(page.url()).searchParams.get(name);

const expectLabels = (page: Page, token: string, labels: string[]) =>
  expect.poll(() => cardLabels(page, token)).toEqual(labels);

test.describe('the filters of /browse', { tag: TAGS.slow }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.beforeEach(({ request }) => requirePublicSeeds(request));

  test('a visitor sorts /browse and filters it by the number of entrants', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { token } = await seedGiveaways(request, testInfo, [
      ['three', { endsIn: 4 * DAY, entries: entrants(3, ns) }],
      ['none', { endsIn: 2 * DAY }],
      ['two', { endsIn: 5 * DAY, entries: entrants(2, ns) }],
      ['one', { endsIn: 3 * DAY, entries: entrants(1, ns) }]
    ]);

    await page.goto(`/browse?search=${token}`);
    await expectLabels(page, token, ['three', 'two', 'one', 'none']);

    const sorts: [string, string, string[]][] = [
      ['Fewest Entrants', 'entrants-asc', ['none', 'one', 'two', 'three']],
      ['Ending Soon', 'ending-soon', ['none', 'one', 'three', 'two']],
      ['Newest', 'newest', ['one', 'two', 'none', 'three']]
    ];
    for (const [sort, value, labels] of sorts) {
      await sortBy(page, sort);
      await expect.poll(() => param(page, 'sortBy')).toBe(value);
      expect(param(page, 'search')).toBe(token);
      await expectLabels(page, token, labels);
    }

    const sheet = await openFilters(page);
    await sheet.getByRole('spinbutton', { name: 'Minimum Entrants' }).fill('1');
    await sheet.getByRole('spinbutton', { name: 'Maximum Entrants' }).fill('2');
    await applyFilters(page);
    await expect.poll(() => param(page, 'minEntrants')).toBe('1');
    expect(param(page, 'maxEntrants')).toBe('2');
    expect(param(page, 'sortBy')).toBe('newest');
    await expectLabels(page, token, ['one', 'two']);
  });

  test('a visitor shows only the giveaways of the statuses they choose', async ({
    page,
    request
  }, testInfo) => {
    const { token } = await seedGiveaways(request, testInfo, [
      ['running', { preset: 'running' }],
      ['scheduled', { preset: 'scheduled', startsIn: 2 * HOUR }],
      ['expired', { preset: 'ended', endsIn: -2 * HOUR }]
    ]);

    await page.goto(`/browse?search=${token}`);
    await expect(page.getByText('Showing 3 giveaways')).toBeVisible();

    const sheet = await openFilters(page);
    for (const status of ['Scheduled', 'Expired', 'Completed']) {
      await sheet.getByRole('checkbox', { name: status }).click();
    }
    await applyFilters(page);
    await expect.poll(() => param(page, 'showStatuses')).toBe('RUNNING');
    await expectLabels(page, token, ['running']);

    for (const [status, label] of [
      ['SCHEDULED', 'scheduled'],
      ['EXPIRED', 'expired'],
      ['RUNNING,EXPIRED', 'expired running']
    ]) {
      await page.goto(`/browse?search=${token}&showStatuses=${status}`);
      await expect
        .poll(async () => (await cardLabels(page, token)).sort().join(' '))
        .toBe(label);
    }
  });

  test('Completed shows the public giveaways completed in the last day', async ({
    page,
    request
  }, testInfo) => {
    const { token, seeded } = await seedGiveaways(request, testInfo, [
      ['completed', { preset: 'completed', endsIn: -2 * HOUR }]
    ]);

    await page.goto(`/browse?search=${token}&showStatuses=COMPLETED`);

    await expect(giveawayCard(page, seeded.completed.name)).toBeVisible();
  });

  test('a visitor pages through /browse', async ({
    page,
    request
  }, testInfo) => {
    const labels = Array.from({ length: 21 }, (_, index) => `n${index}`);
    const { token } = await seedGiveaways(
      request,
      testInfo,
      labels.map((label) => [label, {}])
    );

    await page.goto(`/browse?search=${token}`);
    await expect(page.getByText('Showing 20 giveaways')).toBeVisible();
    const first = await cardLabels(page, token);

    await page.getByRole('link', { name: 'Go to next page' }).click();
    await expect.poll(() => param(page, 'page')).toBe('2');
    expect(param(page, 'search')).toBe(token);
    await expect(page.getByText('Showing 1 giveaway')).toBeVisible();
    const second = await cardLabels(page, token);
    expect([...first, ...second].sort()).toEqual([...labels].sort());
    await expect(
      page.getByRole('link', { name: 'Go to next page' })
    ).toHaveAttribute('aria-disabled', 'true');

    await page.getByRole('link', { name: 'Go to previous page' }).click();
    await expect.poll(() => param(page, 'page')).toBeNull();
    await expect(page.getByText('Showing 20 giveaways')).toBeVisible();
  });
});

test.describe('hide participation on /browse', { tag: TAGS.slow }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.beforeEach(({ request }) => requirePublicSeeds(request));

  test('hides the giveaways that the participant entered', async ({
    freshPersona,
    page,
    request
  }, testInfo) => {
    const { ns } = await freshPersona('participant');
    const { token } = await seedGiveaways(request, testInfo, [
      [
        'entered',
        {
          entries: [{ persona: 'participant', ns, completions: [{ task: 0 }] }]
        }
      ],
      ['other', {}]
    ]);

    await page.goto(`/browse?search=${token}`);
    await expect(page.getByText('Showing 2 giveaways')).toBeVisible();

    const sheet = await openFilters(page);
    await sheet.getByRole('switch', { name: 'Hide participation' }).click();
    await applyFilters(page);

    await expect.poll(() => param(page, 'hideEntered')).toBe('true');
    await expectLabels(page, token, ['other']);
  });

  test('keeps the giveaways that the participant only opened', async ({
    freshPersona,
    page,
    request
  }, testInfo) => {
    await freshPersona('participant');
    const { token, seeded } = await seedGiveaways(request, testInfo, [
      ['opened', {}],
      ['other', {}]
    ]);
    await page.goto(`/browse/${seeded.opened.id}`);
    await expect(
      page.getByRole('heading', { name: seeded.opened.name })
    ).toBeVisible();

    await page.goto(`/browse?search=${token}&hideEntered=true`);

    await expect(page.getByText('Showing 2 giveaways')).toBeVisible();
  });
});

test.describe('the query string of /browse', () => {
  for (const query of ['page=abc', 'sortBy=x', 'minEntrants=abc']) {
    test(`/browse?${query} shows the list instead of an error`, async ({
      page
    }, testInfo) => {
      await page.goto(`/browse?search=${freshSlug(testInfo)}&${query}`);

      await expect(noGiveaways(page)).toBeVisible();
    });
  }
});
