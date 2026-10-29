import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { pickDate } from '../../helpers/editor';
import {
  MIN_TIME_MARGIN_SECONDS,
  jobStatuses,
  requireFakes,
  runJobs,
  seedSweepstakes,
  sweepstakesJobStatuses,
  waitUntil
} from '../../helpers/jobs';
import { knownBug } from '../../helpers/known-bug';
import { expectSaved, openEditor, saveChanges } from '../../helpers/manage';
import { signInAs } from '../../helpers/personas';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const TIME_MARGIN_MS = 2_000;

const START_DATE_BUG = 182;

type DiscordAlert = { embeds: { title: string; url: string }[] };

const alertsOf = (request: APIRequestContext, sweepstakesId: string) =>
  seedApi(request).outbox({ channel: 'discord-alert', target: sweepstakesId });

const promotionTab = (slug: string, id: string) =>
  `/app/${slug}/sweepstakes/${id}/promotion`;

const scheduleBlueskyPost = async (page: Page) => {
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Post to Bluesky' }).click();
  await page.getByRole('button', { name: 'Schedule Post' }).click();
  await expect(
    page.getByText('Bluesky post scheduled successfully')
  ).toBeVisible();
};

const expectPostBadge = async (page: Page, label: 'Scheduled' | 'Posted') => {
  await page.getByRole('button', { name: 'View details' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(label, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
};

const postStatuses = async (request: APIRequestContext, id: string) =>
  jobStatuses((await seedApi(request).jobs(id)).jobs.posts);

const seedPostingTeam = async (
  page: Page,
  request: APIRequestContext,
  ns: string
) => {
  const { team } = await seedApi(request).team({ ns, suffix: 'ap' });
  await seedApi(request).integrations({
    team: team.slug,
    integrations: [{ provider: 'BLUESKY' }]
  });
  await signInAs(page.request, 'host', ns);
  return team;
};

test.describe('the lifecycle jobs of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('the activation of an unlisted giveaway sends no Discord alert', async ({
    request
  }, testInfo) => {
    await requireFakes(request, ['discord']);
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedSweepstakes(request, {
      ns: RUN_ID,
      team: team.slug
    });

    const run = await runJobs(request, giveaway.id);

    expect(sweepstakesJobStatuses(run)).toMatchObject({
      PROCESS_ACTIVATION: 'COMPLETED',
      PROCESS_MODIFICATION: 'COMPLETED'
    });
    expect(await alertsOf(request, giveaway.id)).toEqual([]);
  });

  test('the activation of a public giveaway sends one Discord alert that links to it', async ({
    request
  }, testInfo) => {
    await requireFakes(request, ['discord'], { allowPublic: true });
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedSweepstakes(request, {
      ns: RUN_ID,
      team: team.slug,
      visibility: 'PUBLIC'
    });

    await runJobs(request, giveaway.id);
    const again = await runJobs(request, giveaway.id);

    expect(sweepstakesJobStatuses(again)).toMatchObject({
      PROCESS_ACTIVATION: 'COMPLETED'
    });
    const alerts = await alertsOf(request, giveaway.id);
    expect(alerts).toHaveLength(1);
    const [embed] = (alerts[0].payload as DiscordAlert).embeds;
    expect(embed.title).toBe(giveaway.name);
    expect(new URL(embed.url).pathname).toBe(
      `/browse/${giveaway.slug ?? giveaway.id}`
    );
  });

  test(
    'a giveaway completed before its end date ends every job without an error',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedSweepstakes(request, {
        ns: RUN_ID,
        team: team.slug,
        endsIn: MIN_TIME_MARGIN_SECONDS,
        entries: [
          {
            persona: 'participant',
            ns: `${RUN_ID}ce${testInfo.parallelIndex}`,
            completions: [{ task: 0 }]
          }
        ],
        draws: [{ entry: 0, prize: 0 }]
      });
      await runJobs(request, giveaway.id);

      await page.goto(`/app/${team.slug}/sweepstakes/${giveaway.id}/winners`);
      await page.getByRole('button', { name: 'Mark as Completed' }).click();
      await page
        .getByRole('button', { name: 'Yes, Complete Sweepstakes' })
        .click();
      await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
        timeout: 30_000
      });

      await waitUntil(new Date(giveaway.endsAt.getTime() + TIME_MARGIN_MS));
      const run = await runJobs(request, giveaway.id);

      expect(
        run.jobs.sweepstakes.map(({ type, status, error }) => ({
          type,
          status,
          error
        }))
      ).toEqual(
        expect.arrayContaining(
          [
            'PROCESS_ACTIVATION',
            'PROCESS_MODIFICATION',
            'PROCESS_EXPIRATION',
            'PROCESS_COMPLETION'
          ].map((type) => ({ type, status: 'COMPLETED', error: null }))
        )
      );
    }
  );
});

test.describe('the scheduled posts of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test.beforeEach(async ({ request }) => {
    await requireFakes(request, ['bluesky']);
  });

  test(
    'a scheduled Bluesky post goes out at the start time and adds its import tasks',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const team = await seedPostingTeam(page, request, ns);
      const giveaway = await seedSweepstakes(request, {
        ns,
        team: team.slug,
        preset: 'scheduled',
        startsIn: MIN_TIME_MARGIN_SECONDS
      });

      await page.goto(promotionTab(team.slug, giveaway.id));
      await scheduleBlueskyPost(page);
      await expectPostBadge(page, 'Scheduled');

      await runJobs(request, giveaway.id);
      expect(await postStatuses(request, giveaway.id)).toEqual({
        POST_TO_BLUESKY: 'PENDING'
      });
      const outbox = { channel: 'bluesky', target: team.id } as const;
      expect(await seedApi(request).outbox(outbox)).toEqual([]);

      await waitUntil(new Date(giveaway.startsAt.getTime() + TIME_MARGIN_MS));
      await runJobs(request, giveaway.id);

      expect(await postStatuses(request, giveaway.id)).toEqual({
        POST_TO_BLUESKY: 'COMPLETED'
      });
      await page.reload();
      await expectPostBadge(page, 'Posted');
      expect(await seedApi(request).outbox(outbox)).toHaveLength(1);
      const { sweepstakes } = await seedApi(request).rows<{
        sweepstakes: { _count: { tasks: number } };
      }>({ view: 'sweepstakes', id: giveaway.id });
      expect(sweepstakes._count.tasks).toBe(giveaway.tasks.length + 2);
    }
  );

  test(
    'a scheduled post moves with the start date of its giveaway',
    knownBug(START_DATE_BUG, { tag: TAGS.slow }),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const team = await seedPostingTeam(page, request, ns);
      const giveaway = await seedSweepstakes(request, {
        ns,
        team: team.slug,
        preset: 'scheduled',
        startsIn: MIN_TIME_MARGIN_SECONDS
      });

      await page.goto(promotionTab(team.slug, giveaway.id));
      await scheduleBlueskyPost(page);
      await openEditor(page, team.slug, giveaway.id);
      await pickDate(page, 'Start Date', 2);
      await saveChanges(page);
      await expectSaved(page);

      await waitUntil(new Date(giveaway.startsAt.getTime() + TIME_MARGIN_MS));
      await runJobs(request, giveaway.id);

      expect(await postStatuses(request, giveaway.id)).toEqual({
        POST_TO_BLUESKY: 'PENDING'
      });
      expect(
        await seedApi(request).outbox({ channel: 'bluesky', target: team.id })
      ).toEqual([]);
    }
  );
});
