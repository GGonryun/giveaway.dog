import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import {
  createDraft,
  dashboardRow,
  fillComplete,
  giveawayName,
  openAsVisitor,
  publishNow,
  searchDashboard
} from '../../helpers/editor';
import { seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

test.describe('create and publish a giveaway in the editor', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test(
    'a host creates a giveaway from scratch and publishes it now',
    { tag: TAGS.slow },
    async ({ page, request, browser }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const name = giveawayName(testInfo, 'now');

      const id = await createDraft(page, team.slug);
      await fillComplete(page, { name, startsIn: 0, endsIn: 10 });
      await publishNow(page, team.slug, /go live immediately/);

      await searchDashboard(page, name);
      const row = dashboardRow(page, name);
      await expect(row.getByRole('cell')).toHaveText([
        name,
        '0',
        '0',
        /^Ends in /,
        'running',
        ''
      ]);
      await page.reload();
      await expect(
        page.getByRole('textbox', {
          name: 'Search sweepstakes by title, prize, status...'
        })
      ).toHaveValue(name);
      await expect(row.getByRole('cell').nth(4)).toHaveText('running');

      await row.getByRole('link', { name }).click();
      await expect(page).toHaveURL(
        new RegExp(`/app/${team.slug}/sweepstakes/${id}/preview$`),
        { timeout: 30_000 }
      );
      await expect(page.getByText('Sweepstakes is Unlisted')).toBeVisible();
      await expect(page.getByText('Start Date', { exact: true })).toBeVisible();
      await expect(page.getByText('End Date', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('textbox', { name: 'Sweepstakes URL' })
      ).toHaveValue(new RegExp(`/browse/${id}$`));

      const visitor = await openAsVisitor(browser, `/browse/${id}`);
      await expect(
        visitor.page.getByRole('heading', { name, level: 1 })
      ).toBeVisible();
      await expect(visitor.page.getByRole('img', { name })).toBeVisible();
      await expect(
        visitor.page.getByText('Click for a bonus entry')
      ).toBeVisible();
      await visitor.page.getByRole('tab', { name: 'Prizes' }).click();
      await expect(visitor.page.getByText('My Custom Prize')).toBeVisible();
      await visitor.context.close();
    }
  );

  test(
    'a host publishes a giveaway that starts later',
    { tag: TAGS.slow },
    async ({ page, request, browser }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const name = giveawayName(testInfo, 'later');

      const id = await createDraft(page, team.slug);
      await fillComplete(page, { name, startsIn: 3, endsIn: 10 });
      await publishNow(page, team.slug, /go live in 2 days|go live in 3 days/);

      await page.getByRole('tab', { name: 'Scheduled' }).click();
      await searchDashboard(page, name);
      const row = dashboardRow(page, name);
      await expect(row.getByRole('cell').nth(3)).toHaveText(/^Starts in /);
      await expect(row.getByRole('cell').nth(4)).toHaveText('scheduled');

      const visitor = await openAsVisitor(browser, `/browse/${id}`);
      await expect(
        visitor.page.getByRole('heading', { name: 'Giveaway Starting Soon' })
      ).toBeVisible();
      await visitor.context.close();
    }
  );
});
