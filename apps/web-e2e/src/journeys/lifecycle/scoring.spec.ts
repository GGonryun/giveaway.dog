import type { APIRequestContext, Page } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { requireFakes } from '../../helpers/jobs';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';
import {
  endedGiveaway,
  personaName,
  readDraws,
  winnersPage
} from '../../helpers/winners';

const MIN_QUALITY_SCORE = 40;
const BANNED_SCORE = 10;

const trackAndScore = async (
  page: Page,
  request: APIRequestContext,
  persona: E2ePersona,
  ns: string
) => {
  await signInAs(page.request, persona, ns);
  await page.goto('/portal');
  let score: number | undefined;
  await expect
    .poll(
      async () => {
        score = (await seedApi(request).scoreUser({ persona, ns })).quality
          ?.score;
        return score;
      },
      { message: `No quality score for ${persona}`, timeout: 30_000 }
    )
    .toBeDefined();
  return score!;
};

const userRow = (page: Page, persona: E2ePersona) =>
  page
    .getByRole('row')
    .filter({ hasText: new RegExp(`${personaName(persona)}(?!\\d)`) });

test.describe('the quality scores of the entrants', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test.beforeEach(async ({ request }) => {
    await requireFakes(request, ['geo']);
  });

  test('tracking and scoring give each entrant a quality score that the draw uses', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const { team } = await seed.team({ ns, suffix: 'sc' });
    const giveaway = await seed.sweepstakes(
      endedGiveaway({
        ns,
        team: team.slug,
        prizes: [{ name: 'Golden Bone', quota: 2 }],
        criteria: {
          minQualityScore: MIN_QUALITY_SCORE,
          minTasksCompleted: 1,
          allowMultipleWins: false,
          allowUserSelection: false
        },
        entries: [
          { persona: 'participant', completions: [{ task: 0 }] },
          { persona: 'participant2', completions: [{ task: 0 }] }
        ]
      })
    );
    const [trusted, bot] = giveaway.entries;
    await seed.userExtras({
      ns,
      users: [
        { persona: 'participant2', turnstile: { success: true, score: 0 } }
      ]
    });

    expect(
      await trackAndScore(page, request, 'participant', ns)
    ).toBeGreaterThanOrEqual(MIN_QUALITY_SCORE);
    expect(await trackAndScore(page, request, 'participant2', ns)).toBe(
      BANNED_SCORE
    );

    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/users`);
    await expect(userRow(page, 'participant2')).toContainText('Banned');
    await expect(userRow(page, 'participant')).not.toContainText('Banned');

    await page.goto(winnersPage(team.slug, giveaway.id));
    await page.getByRole('button', { name: 'Pick All Winners' }).click();
    await expect
      .poll(async () =>
        (await readDraws(request, giveaway.id)).draws.map(
          ({ userId, result }) => ({ userId, result })
        )
      )
      .toEqual([{ userId: trusted.userId, result: 'WINNER' }]);
    expect(
      (await readDraws(request, giveaway.id)).draws.map(({ userId }) => userId)
    ).not.toContain(bot.userId);
  });
});
