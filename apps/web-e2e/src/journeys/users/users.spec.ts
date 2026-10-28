import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';

type Entrant = 'participant' | 'participant2' | 'newbie';

const ENTRANTS = [
  { persona: 'participant2', quality: 60, source: 'TWITTER_IMPORT' },
  { persona: 'participant', quality: 20, source: 'SIGNUP' },
  { persona: 'newbie', quality: 90, source: 'TWITTER_IMPORT' }
] as const;

const NAMES = /E2E (participant2|participant|newbie)\b/;

const nameOf = (persona: Entrant) => `E2E ${persona}`;

const seedEntrants = async (request: APIRequestContext, ns: string) => {
  const seed = seedApi(request);
  const { team } = await seed.team({ ns, suffix: 'u', name: `Users ${ns}` });
  const entrants: Record<
    Entrant,
    { userId: string; email: string; giveaway: string }
  > = {} as never;

  for (const { persona, quality } of ENTRANTS) {
    const giveaway = await seed.sweepstakes({
      ns,
      team: team.slug,
      name: `Giveaway of ${persona}`,
      entries: [{ persona, quality, completions: [{ task: 0 }] }]
    });
    const [entry] = giveaway.entries;
    entrants[persona] = {
      userId: entry.userId,
      email: entry.email,
      giveaway: giveaway.name
    };
  }

  await seed.userExtras({
    ns,
    users: ENTRANTS.map(({ persona, source }) => ({ persona, source }))
  });

  return { team, entrants };
};

const userRows = (page: Page) =>
  page.getByRole('rowgroup').nth(1).getByRole('row');

const rowNames = async (page: Page) =>
  (await userRows(page).allInnerTexts()).map(
    (text) => text.match(NAMES)?.[0] ?? text
  );

const expectNames = async (page: Page, personas: Entrant[]) =>
  expect
    .poll(() => rowNames(page))
    .toEqual(personas.map((persona) => nameOf(persona)));

const expectSameNames = async (page: Page, personas: Entrant[]) =>
  expect
    .poll(async () => (await rowNames(page)).sort())
    .toEqual(personas.map((persona) => nameOf(persona)).sort());

const search = async (page: Page, term: string) => {
  await expect(async () => {
    await page
      .getByRole('textbox', { name: 'Search by name, email, or ID...' })
      .fill(term);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`search=${encodeURIComponent(term)}`),
      { timeout: 2000 }
    );
  }).toPass();
};

const sortBy = async (
  page: Page,
  column: 'Quality' | 'Last Entry',
  field: string,
  direction: 'asc' | 'desc'
) => {
  await page.getByRole('button', { name: column }).click();
  await expect(page).toHaveURL(
    new RegExp(`sortBy=${field}&sortDirection=${direction}`)
  );
};

const openFilters = async (page: Page) => {
  await page.getByRole('button', { name: 'Filters' }).click();
  return page.getByRole('dialog', { name: 'Filter Users' });
};

test.describe('the team Users area', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test("a host sees the team's entrants and opens a user's details", async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team, entrants } = await seedEntrants(request, ns);
    await signInAs(page.request, 'host', ns);

    await page.goto(`/app/${team.slug}/users`);
    await expectSameNames(page, ['participant', 'participant2', 'newbie']);

    const target = entrants.participant;
    for (const term of [target.email, target.userId]) {
      await search(page, term);
      await expectNames(page, ['participant']);
    }

    const row = userRows(page).filter({ hasText: nameOf('participant') });
    await expect(row).toContainText('Banned');
    await row.getByRole('button', { name: 'User actions' }).click();
    await page.getByRole('menuitem', { name: 'Quick View' }).click();
    const sheet = page.getByRole('dialog');
    await expect(
      sheet.getByRole('heading', { name: nameOf('participant') })
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);

    await page.goto(`/app/${team.slug}/users/${target.userId}/overview`);
    await expect(
      page.getByRole('heading', { level: 1, name: nameOf('participant') })
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByText('Banned').first()).toBeVisible();
    await expect(page.getByText('Account Health')).toBeVisible();

    await page.goto(`/app/${team.slug}/users/${target.userId}/entries`);
    const entries = page.getByRole('rowgroup').nth(1).getByRole('row');
    await expect(entries).toHaveCount(1);
    await expect(entries).toContainText(target.giveaway);
  });

  test('a host sorts the Users list by quality and by last entry', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedEntrants(request, ns);
    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/users`);
    await expectSameNames(page, ['participant', 'participant2', 'newbie']);

    await sortBy(page, 'Quality', 'qualityScore', 'desc');
    await expectNames(page, ['newbie', 'participant2', 'participant']);
    await sortBy(page, 'Quality', 'qualityScore', 'asc');
    await expectNames(page, ['participant', 'participant2', 'newbie']);

    await sortBy(page, 'Last Entry', 'lastEntry', 'desc');
    await expectNames(page, ['newbie', 'participant', 'participant2']);
    await sortBy(page, 'Last Entry', 'lastEntry', 'asc');
    await expectNames(page, ['participant2', 'participant', 'newbie']);
  });

  test('a host filters the Users list by source and quality score', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedEntrants(request, ns);
    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/users`);
    await expectSameNames(page, ['participant', 'participant2', 'newbie']);

    let filters = await openFilters(page);
    await filters.getByRole('checkbox', { name: 'Twitter Import' }).check();
    await filters.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(page).toHaveURL(/sources=TWITTER_IMPORT/);
    await expectSameNames(page, ['participant2', 'newbie']);

    filters = await openFilters(page);
    await filters
      .getByRole('spinbutton', { name: 'Minimum Quality Score' })
      .fill('50');
    await filters
      .getByRole('spinbutton', { name: 'Maximum Quality Score' })
      .fill('80');
    await filters.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(page).toHaveURL(/minQualityScore=50&maxQualityScore=80/);
    await expectNames(page, ['participant2']);

    filters = await openFilters(page);
    await filters.getByRole('button', { name: 'Clear' }).click();
    await expect(page).not.toHaveURL(/sources=|QualityScore=/);
    await expectSameNames(page, ['participant', 'participant2', 'newbie']);
  });

  test(
    'a minimum quality score above the maximum shows a validation message',
    knownBug(107),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedEntrants(request, ns);
      await signInAs(page.request, 'host', ns);
      await page.goto(`/app/${team.slug}/users`);
      await expectSameNames(page, ['participant', 'participant2', 'newbie']);

      const filters = await openFilters(page);
      await filters
        .getByRole('spinbutton', { name: 'Minimum Quality Score' })
        .fill('80');
      await filters
        .getByRole('spinbutton', { name: 'Maximum Quality Score' })
        .fill('50');
      await filters.getByRole('button', { name: 'Apply Filters' }).click();

      await expect(
        page.getByText(/minimum.*(above|greater|higher).*maximum/i)
      ).toBeVisible();
    }
  );

  test('[USERS-001] [USERS-002] the Users page ignores the values of a malformed query string', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedEntrants(request, ns);
    await signInAs(page.request, 'host', ns);

    for (const query of [
      'page=0',
      'minQualityScore=150',
      'sources=FOO',
      'pageSize=1000&sortBy=email&sortDirection=up'
    ]) {
      await page.goto(`/app/${team.slug}/users?${query}`);
      await expect(page.getByText(/Failed to load users/)).toHaveCount(0);
      await expectSameNames(page, ['participant', 'participant2', 'newbie']);
    }
  });

  test(
    'the owner of a new team sees an empty Users list',
    knownBug(57),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedApi(request).team({
        ns,
        suffix: 'e',
        name: `Empty ${ns}`
      });
      await signInAs(page.request, 'host', ns);
      await page.goto(`/app/${team.slug}/users`);

      await expect(
        page.getByRole('textbox', { name: 'Search by name, email, or ID...' })
      ).toBeVisible();
      await expect(userRows(page)).toHaveCount(0);
      await expect(page.getByText('1-0 of 0')).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Next page' })
      ).toBeDisabled();
      await expect(
        page.getByRole('button', { name: 'Last page' })
      ).toBeDisabled();
    }
  );
});
