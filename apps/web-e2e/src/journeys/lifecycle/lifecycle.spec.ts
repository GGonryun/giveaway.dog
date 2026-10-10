import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { hostPreviewUrl, waitForGiveawayState } from '../../helpers/giveaway';
import { expectAfterReloads } from '../../helpers/poll';
import { runJobs, seedSweepstakes, seedWorkerTeam } from '../../helpers/seed';
import { blockThirdParties } from '../../helpers/third-party';

const ENDS_IN_SECONDS = 60;

const LIFECYCLE_TIMEOUT_MS = 120_000;

const jobStatuses = (jobs: { type: string; status: string }[]) =>
  Object.fromEntries(jobs.map(({ type, status }) => [type, status]));

test.describe('the lifecycle of a giveaway', { tag: '@slow' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('publish, run the jobs, end, draw, complete, run the jobs', async ({
    page,
    browser,
    request
  }, testInfo) => {
    test.setTimeout(LIFECYCLE_TIMEOUT_MS);
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedSweepstakes(request, {
      ns: RUN_ID,
      team: team.slug,
      preset: 'draft',
      startsIn: -60,
      endsIn: ENDS_IN_SECONDS,
      audience: { allowedIdentities: ['ANONYMOUS'] },
      criteria: { minQualityScore: 0 }
    });
    const endsAt = new Date(giveaway.endDate).getTime();

    await page.goto(`/app/${team.slug}/sweepstakes/${giveaway.id}/create`);
    await page.getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByRole('button', { name: 'Publish Now' }).click();
    await expect(
      page.getByText('Sweepstakes published successfully!')
    ).toBeVisible();

    const published = await runJobs(request, giveaway.id);
    expect(jobStatuses(published.jobs.sweepstakes)).toEqual({
      PROCESS_ACTIVATION: 'COMPLETED',
      PROCESS_MODIFICATION: 'COMPLETED',
      PROCESS_EXPIRATION: 'PENDING'
    });

    const context = await browser.newContext({
      storageState: personaState('participant')
    });
    await blockThirdParties(context);
    const entrant = await context.newPage();
    await entrant.goto(`/browse/${giveaway.id}`);
    await entrant
      .getByRole('checkbox', { name: /I am at least 16 years of age/ })
      .check();
    await entrant
      .getByRole('button', { name: 'Continue to Sweepstakes' })
      .click();
    await entrant
      .getByRole('heading', { name: 'Click for a bonus entry' })
      .click();
    await entrant.getByRole('button', { name: 'Continue' }).click();
    await expectAfterReloads(entrant, () =>
      expect(entrant.getByText('1/1 completed')).toBeVisible()
    );

    await page.waitForTimeout(Math.max(0, endsAt - Date.now()) + 2_000);
    const ended = await runJobs(request, giveaway.id);
    expect(jobStatuses(ended.jobs.sweepstakes)).toMatchObject({
      PROCESS_EXPIRATION: 'COMPLETED'
    });
    await page.goto(hostPreviewUrl(team.slug, giveaway.id), {
      waitUntil: 'networkidle'
    });
    await waitForGiveawayState(page, 'expired');

    await page.goto(`/app/${team.slug}/sweepstakes/${giveaway.id}/winners`);
    await page.getByRole('button', { name: 'Pick All Winners' }).click();
    await page.getByRole('button', { name: 'Mark as Completed' }).click();
    await page
      .getByRole('button', { name: 'Yes, Complete Sweepstakes' })
      .click();
    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`));

    const completed = await runJobs(request, giveaway.id);
    expect(jobStatuses(completed.jobs.sweepstakes)).toEqual({
      PROCESS_ACTIVATION: 'COMPLETED',
      PROCESS_MODIFICATION: 'COMPLETED',
      PROCESS_EXPIRATION: 'COMPLETED',
      PROCESS_COMPLETION: 'COMPLETED'
    });

    await page.goto(hostPreviewUrl(team.slug, giveaway.id), {
      waitUntil: 'networkidle'
    });
    await waitForGiveawayState(page, 'completed');
    await entrant.reload();
    await expect(
      entrant.getByRole('heading', { name: 'Winners Announced!' })
    ).toBeVisible();
    await context.close();
  });
});
