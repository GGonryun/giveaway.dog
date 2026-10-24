import type { APIRequestContext, Browser, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import { openAsVisitor, openStep } from '../../helpers/editor';
import { knownBug } from '../../helpers/known-bug';
import {
  expectNotFoundAfterReloads,
  expectSaved,
  freshGiveawayNamespace,
  openEditor,
  previewPage,
  readSweepstakes,
  saveChanges
} from '../../helpers/manage';
import { expectAfterReloads } from '../../helpers/poll';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const SLUG_CACHE_BUG = 531;
const PRIVACY_CACHE_BUG = 532;

const seedUnlisted = async (
  request: APIRequestContext,
  team: string,
  testInfo: { workerIndex: number }
) => {
  const { ns, slug } = freshGiveawayNamespace(testInfo);
  return seedApi(request).sweepstakes({ ns, team, slug });
};

const warmPublicPages = async (
  browser: Browser,
  paths: string[],
  name: string
) => {
  const visitor = await openAsVisitor(browser, paths[0]);
  for (const path of paths) {
    await visitor.page.goto(path);
    await expect(
      visitor.page.getByRole('heading', { name, level: 1 })
    ).toBeVisible();
  }
  return visitor;
};

const expectHeadingAfterReloads = async (
  page: Page,
  path: string,
  name: string
) => {
  await page.goto(path);
  await expectAfterReloads(page, () =>
    expect(page.getByRole('heading', { name, level: 1 })).toBeVisible({
      timeout: 5_000
    })
  );
};

const renameInEditor = async (
  page: Page,
  team: string,
  id: string,
  name: string
) => {
  await openEditor(page, team, id);
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await saveChanges(page);
  await expectSaved(page);
};

test.describe('a published giveaway on its public page', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('[EDIT-006] a visitor sees the host’s edit at the id URL', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedUnlisted(request, team.slug, testInfo);
    const visitor = await warmPublicPages(
      browser,
      [`/browse/${giveaway.id}`],
      giveaway.name
    );

    const renamed = `${giveaway.name} renamed`;
    await renameInEditor(page, team.slug, giveaway.id, renamed);

    await expectHeadingAfterReloads(
      visitor.page,
      `/browse/${giveaway.id}`,
      renamed
    );
    await visitor.context.close();
  });

  test(
    '[EDIT-006] a visitor sees the host’s edit at the custom slug URL',
    knownBug(SLUG_CACHE_BUG),
    async ({ page, request, browser }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedUnlisted(request, team.slug, testInfo);
      const slug = giveaway.slug!;
      const visitor = await warmPublicPages(
        browser,
        [`/browse/${slug}`],
        giveaway.name
      );

      const renamed = `${giveaway.name} renamed`;
      await renameInEditor(page, team.slug, giveaway.id, renamed);

      await expectHeadingAfterReloads(visitor.page, `/browse/${slug}`, renamed);
      await visitor.context.close();
    }
  );

  test(
    '[VIS-005] a giveaway made private from the preview tab is not found at once',
    knownBug(PRIVACY_CACHE_BUG),
    async ({ page, request, browser }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedUnlisted(request, team.slug, testInfo);
      const slug = giveaway.slug!;
      const paths = [`/browse/${giveaway.id}`, `/browse/${slug}`];
      const visitor = await warmPublicPages(browser, paths, giveaway.name);

      await page.goto(previewPage(team.slug, giveaway.id));
      await page
        .getByRole('alert')
        .filter({ hasText: 'Sweepstakes is Unlisted' })
        .getByRole('combobox')
        .click();
      await page.getByRole('option', { name: 'Private' }).click();
      await expectAfterReloads(page, () =>
        expect(
          page.getByRole('alert').filter({ hasText: 'Sweepstakes is Private' })
        ).toBeVisible({ timeout: 10_000 })
      );
      await expect
        .poll(
          async () =>
            (await readSweepstakes(request, giveaway.id)).visibility.visibility
        )
        .toBe('PRIVATE');

      for (const path of paths) {
        await expectNotFoundAfterReloads(visitor.page, path);
      }
      await visitor.context.close();
    }
  );

  test(
    '[VIS-005] a giveaway made private in the editor is not found at once',
    knownBug(PRIVACY_CACHE_BUG),
    async ({ page, request, browser }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedUnlisted(request, team.slug, testInfo);
      const slug = giveaway.slug!;
      const paths = [`/browse/${giveaway.id}`, `/browse/${slug}`];
      const visitor = await warmPublicPages(browser, paths, giveaway.name);

      await openEditor(page, team.slug, giveaway.id);
      await openStep(page, 'Audience');
      await page.getByRole('combobox', { name: 'Visibility Type' }).click();
      await page.getByRole('option', { name: 'Private' }).click();
      await saveChanges(page);
      await expectSaved(page);
      await expect
        .poll(
          async () =>
            (await readSweepstakes(request, giveaway.id)).visibility.visibility
        )
        .toBe('PRIVATE');

      for (const path of paths) {
        await expectNotFoundAfterReloads(visitor.page, path);
      }
      await visitor.context.close();
    }
  );
});
