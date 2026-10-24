import type { Page } from '@playwright/test';
import type { E2eSweepstakesPreset } from '@giveaway/e2e-model/requests';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { clickUntilUrl, dashboardRow } from '../../helpers/editor';
import { knownBug } from '../../helpers/known-bug';
import { searchList } from '../../helpers/manage';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const DATE_RANGE_BUG = 536;

const DAY = 24 * 60 * 60;

const PRESETS = [
  'draft',
  'scheduled',
  'running',
  'ended',
  'completed'
] as const satisfies E2eSweepstakesPreset[];

const TABS: { tab: string; status: string; presets: E2eSweepstakesPreset[] }[] =
  [
    { tab: 'Active', status: 'RUNNING', presets: ['running'] },
    { tab: 'Scheduled', status: 'SCHEDULED', presets: ['scheduled'] },
    { tab: 'Expired', status: 'EXPIRED', presets: ['ended'] },
    { tab: 'Draft', status: 'DRAFT', presets: ['draft'] },
    { tab: 'Completed', status: 'COMPLETED', presets: ['completed'] },
    { tab: 'All', status: 'ALL', presets: [...PRESETS] }
  ];

const searchBox = (page: Page) =>
  page.getByRole('textbox', {
    name: 'Search sweepstakes by title, prize, status...'
  });

const seedOneOfEach = async (
  request: Parameters<typeof seedApi>[0],
  team: string,
  ns: string
) => {
  const seed = seedApi(request);
  const seeded = await Promise.all(
    PRESETS.map((preset) =>
      seed.sweepstakes({ ns, team, preset, name: `List ${preset}` })
    )
  );
  return Object.fromEntries(
    PRESETS.map((preset, index) => [preset, seeded[index]])
  ) as Record<E2eSweepstakesPreset, (typeof seeded)[number]>;
};

test.describe('the dashboard list of giveaways', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('[LIST-001] [LIST-002] [LIST-004] each status tab lists only its giveaways, the search ignores case and both survive a reload', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const giveaways = await seedOneOfEach(request, team.slug, ns);
    const token = `[e2e ${ns}]`;

    await page.goto(`/app/${team.slug}`);
    await searchList(page, token.toUpperCase());
    for (const { tab, status, presets } of TABS) {
      await clickUntilUrl(
        page,
        page.getByRole('tab', { name: tab, exact: true }),
        new RegExp(`[?&]status=${status}(&|$)`)
      );
      await expect(
        page.getByRole('row').filter({ hasText: token })
      ).toHaveCount(presets.length);
      for (const preset of presets) {
        await expect(dashboardRow(page, giveaways[preset].name)).toHaveCount(1);
      }
    }

    await clickUntilUrl(
      page,
      page.getByRole('tab', { name: 'Expired', exact: true }),
      /[?&]status=EXPIRED(&|$)/
    );
    await page.reload();
    await expect(searchBox(page)).toHaveValue(token.toUpperCase());
    await expect(page.getByRole('tab', { name: 'Expired' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(dashboardRow(page, giveaways.ended.name)).toHaveCount(1);
    expect(page.url()).not.toMatch(/\?$/);

    await searchList(page, `${token} nothing matches`);
    await expect(page.getByText('No sweepstakes found')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create Your First Giveaway' })
    ).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: token })).toHaveCount(
      0
    );
  });

  test('[LIST-005] each row opens the page that fits the status of its giveaway', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const draft = await seed.sweepstakes({
      ns,
      team: team.slug,
      preset: 'draft',
      name: 'Row draft'
    });
    const running = await seed.sweepstakes({
      ns,
      team: team.slug,
      name: 'Row running'
    });
    const completed = await seed.sweepstakes({
      ns,
      team: team.slug,
      preset: 'completed',
      name: 'Row completed'
    });
    const base = `/app/${team.slug}/sweepstakes`;

    await page.goto(`/app/${team.slug}`);
    await searchList(page, `[e2e ${ns}]`);
    await expect(page.getByRole('row').filter({ hasText: ns })).toHaveCount(3);

    const menu = async (name: string) => {
      await dashboardRow(page, name)
        .getByRole('button', { name: 'Giveaway actions' })
        .click();
      await expect(page.getByRole('menu')).toBeVisible();
      expect(page.url()).toMatch(new RegExp(`/app/${team.slug}\\?`));
      return page.getByRole('menu');
    };

    const draftMenu = await menu(draft.name);
    await expect(
      draftMenu.getByRole('menuitem', { name: 'View Details' })
    ).toHaveCount(0);
    await expect(
      draftMenu.getByRole('menuitem', { name: 'Edit' })
    ).toHaveAttribute('href', `${base}/${draft.id}/create`);
    await page.keyboard.press('Escape');

    const runningMenu = await menu(running.name);
    await expect(
      runningMenu.getByRole('menuitem', { name: 'View Details' })
    ).toHaveAttribute('href', `${base}/${running.id}`);
    await expect(
      runningMenu.getByRole('menuitem', { name: 'Edit' })
    ).toHaveAttribute('href', `${base}/${running.id}/edit`);
    await page.keyboard.press('Escape');

    const completedMenu = await menu(completed.name);
    await expect(
      completedMenu.getByRole('menuitem', { name: 'Edit' })
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    await clickUntilUrl(
      page,
      dashboardRow(page, running.name).getByRole('link', {
        name: running.name
      }),
      new RegExp(`${base}/${running.id}(/preview)?$`)
    );
    await page.goBack();
    await clickUntilUrl(
      page,
      dashboardRow(page, draft.name).getByRole('link', { name: draft.name }),
      new RegExp(`${base}/${draft.id}/create$`)
    );
  });

  test(
    '[LIST-003] the date range filter lists only the giveaways in that range',
    knownBug(DATE_RANGE_BUG),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const ns = freshNamespace(testInfo.workerIndex);
      const seed = seedApi(request);
      const recent = await seed.sweepstakes({
        ns,
        team: team.slug,
        name: 'Range recent'
      });
      const old = await seed.sweepstakes({
        ns,
        team: team.slug,
        preset: 'ended',
        startsIn: -60 * DAY,
        endsIn: -40 * DAY,
        name: 'Range old'
      });

      await page.goto(`/app/${team.slug}`);
      await searchList(page, `[e2e ${ns}]`);
      await expect(dashboardRow(page, old.name)).toHaveCount(1);
      await page
        .getByRole('combobox')
        .filter({ hasText: 'Date range' })
        .click();
      await page.getByRole('option', { name: 'Last 7 days' }).click();
      await expect(page).toHaveURL(/[?&]dateRange=7d(&|$)/);

      await expect(dashboardRow(page, recent.name)).toHaveCount(1);
      await expect(dashboardRow(page, old.name)).toHaveCount(0);
    }
  );
});
