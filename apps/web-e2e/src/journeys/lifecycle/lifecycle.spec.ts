import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import {
  MIN_TIME_MARGIN_SECONDS,
  runJobs,
  seedSweepstakes,
  sweepstakesJobStatuses,
  waitForGiveawayState,
  waitUntil
} from '../../helpers/jobs';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const END_MARGIN_MS = 2_000;

test.describe('the lifecycle of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test(
    'publish, run the jobs, end, draw, complete and run the jobs again',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const seed = seedApi(request);
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedSweepstakes(request, {
        ns: RUN_ID,
        team: team.slug,
        endsIn: MIN_TIME_MARGIN_SECONDS,
        entries: [
          {
            persona: 'participant',
            ns: `${RUN_ID}lc${testInfo.parallelIndex}`,
            completions: [{ task: 0 }],
            quality: 100
          }
        ]
      });
      const details = `/app/${team.slug}/sweepstakes/${giveaway.id}`;

      const published = await runJobs(request, giveaway.id);
      expect(sweepstakesJobStatuses(published)).toEqual({
        PROCESS_ACTIVATION: 'COMPLETED',
        PROCESS_MODIFICATION: 'COMPLETED',
        PROCESS_EXPIRATION: 'PENDING'
      });

      await page.goto(`${details}/preview`);
      await waitForGiveawayState(page, 'running');

      await waitUntil(new Date(giveaway.endsAt.getTime() + END_MARGIN_MS));
      await page.reload();
      await waitForGiveawayState(page, 'ended');
      const ended = await runJobs(request, giveaway.id);
      expect(sweepstakesJobStatuses(ended)).toMatchObject({
        PROCESS_EXPIRATION: 'COMPLETED'
      });

      await page.goto(`${details}/winners`);
      await page.getByRole('button', { name: 'Pick All Winners' }).click();
      await expect(
        page.getByText('All winners selected', { exact: true })
      ).toBeVisible();

      await page.getByRole('button', { name: 'Mark as Completed' }).click();
      await page
        .getByRole('button', { name: 'Yes, Complete Sweepstakes' })
        .click();
      await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
        timeout: 30_000
      });

      const completed = await runJobs(request, giveaway.id);
      expect(sweepstakesJobStatuses(completed)).toEqual({
        PROCESS_ACTIVATION: 'COMPLETED',
        PROCESS_MODIFICATION: 'COMPLETED',
        PROCESS_EXPIRATION: 'COMPLETED',
        PROCESS_COMPLETION: 'COMPLETED'
      });

      await page.goto(`${details}/preview`);
      await waitForGiveawayState(page, 'completed');

      const { byResult } = await seed.rows<{ byResult: object }>({
        view: 'draws',
        id: giveaway.id
      });
      expect(byResult).toEqual({ WINNER: 1 });
    }
  );
});
