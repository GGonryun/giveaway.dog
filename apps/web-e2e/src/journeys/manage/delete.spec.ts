import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import { dashboardRow, openAsVisitor } from '../../helpers/editor';
import { knownBug } from '../../helpers/known-bug';
import {
  expectNotFoundAfterReloads,
  freshGiveawayNamespace,
  openRowMenu
} from '../../helpers/manage';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const DELETED_ROW_BUG = 534;

const deleteDialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Delete Sweepstakes' });

const openDeleteDialog = async (page: Page, team: string, name: string) => {
  const menu = await openRowMenu(page, team, name);
  await menu.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(deleteDialog(page)).toBeVisible();
  return deleteDialog(page);
};

const confirmDelete = async (page: Page, name: string) => {
  const dialog = deleteDialog(page);
  await dialog.getByLabel(/to confirm deletion/).fill(name.toUpperCase());
  await dialog.getByRole('button', { name: 'Delete Sweepstakes' }).click();
  await expect(page.getByText('Sweepstakes deleted')).toBeVisible({
    timeout: 30_000
  });
  await expect(dialog).toBeHidden();
};

test.describe('deleting a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.slow();
  test.use({ storageState: personaState('host') });

  test('[DELETE-001] the host deletes a giveaway only after typing its name', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const { ns } = freshGiveawayNamespace(testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns,
      team: team.slug,
      entries: [{ persona: 'participant', completions: [{ task: 0 }] }]
    });

    const dialog = await openDeleteDialog(page, team.slug, giveaway.name);
    const confirm = dialog.getByRole('button', { name: 'Delete Sweepstakes' });
    const field = dialog.getByLabel(/to confirm deletion/);
    await expect(confirm).toBeDisabled();
    await field.fill(giveaway.name.slice(0, -1));
    await expect(confirm).toBeDisabled();
    await field.fill(`${giveaway.name}!`);
    await expect(confirm).toBeDisabled();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(dashboardRow(page, giveaway.name)).toHaveCount(1);

    await dashboardRow(page, giveaway.name)
      .getByRole('button', { name: 'Giveaway actions' })
      .click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await confirmDelete(page, giveaway.name);

    await page.reload();
    await expect(page.getByText('No sweepstakes found')).toBeVisible();
    await expect(dashboardRow(page, giveaway.name)).toHaveCount(0);
  });

  test(
    '[DELETE-002] a deleted giveaway leaves the dashboard without a reload',
    knownBug(DELETED_ROW_BUG),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const { ns } = freshGiveawayNamespace(testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns,
        team: team.slug
      });

      await openDeleteDialog(page, team.slug, giveaway.name);
      await confirmDelete(page, giveaway.name);

      await expect(dashboardRow(page, giveaway.name)).toHaveCount(0, {
        timeout: 10_000
      });
    }
  );

  test('[DELETE-003] a deleted giveaway is not found at its id URL or its custom slug URL', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const { ns, slug } = freshGiveawayNamespace(testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns,
      team: team.slug,
      slug
    });
    const paths = [`/browse/${giveaway.id}`, `/browse/${slug}`];
    const visitor = await openAsVisitor(browser, paths[0]);
    for (const path of [...paths, ...paths]) {
      await visitor.page.goto(path);
      await expect(
        visitor.page.getByRole('heading', { name: giveaway.name, level: 1 })
      ).toBeVisible();
    }

    await openDeleteDialog(page, team.slug, giveaway.name);
    await confirmDelete(page, giveaway.name);

    for (const path of paths) {
      await expectNotFoundAfterReloads(visitor.page, path);
    }
    await visitor.context.close();
  });
});
