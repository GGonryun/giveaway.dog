import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, RUN_ID } from '../../env';
import { requirePublicSeeds } from '../../helpers/browse';
import { expectNotInPayload } from '../../helpers/leaks';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

type Visibility = 'PUBLIC' | 'UNLISTED' | 'PRIVATE';

const WINS: { persona: E2ePersona; visibility: Visibility }[] = [
  { persona: 'participant', visibility: 'PUBLIC' },
  { persona: 'participant', visibility: 'PUBLIC' },
  { persona: 'participant2', visibility: 'UNLISTED' },
  { persona: 'newbie', visibility: 'PRIVATE' }
];

test.describe('the winners leaderboard', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.beforeEach(({ request }) => requirePublicSeeds(request));

  test('/winners lists only the winners of public giveaways, with each of their wins', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const ns = freshNamespace(testInfo.workerIndex);
    const nameOf = (persona: E2ePersona) => `E2E ${ns} ${persona}`;
    const giveaways = [];
    for (const [index, { persona, visibility }] of WINS.entries()) {
      giveaways.push(
        await seedApi(request).sweepstakes({
          ns: RUN_ID,
          team: team.slug,
          preset: 'completed',
          visibility,
          name: `${ns} win ${index}`,
          entries: [{ persona, ns, completions: [{ task: 0 }] }],
          draws: [{ entry: 0, prize: 0 }]
        })
      );
    }
    const personas = [...new Set(WINS.map(({ persona }) => persona))];
    const { users } = await seedApi(request).userExtras({
      ns,
      users: personas.map((persona) => ({ persona, name: nameOf(persona) }))
    });

    await page.goto(`/winners?search=${ns}`);

    const rows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    await expect(rows).toHaveCount(1);
    const winner = rows.filter({ hasText: nameOf('participant') });
    await expect(winner).toBeVisible();
    await expect(winner.getByRole('cell').nth(2)).toHaveText('2');

    await winner.getByRole('button', { name: 'All prizes' }).click();
    const prizes = page
      .getByRole('row')
      .filter({ hasText: 'All Prizes' })
      .getByRole('link');
    await expect(prizes).toHaveCount(2);
    expect(
      (
        await prizes.evaluateAll((links) =>
          links.map((link) => link.getAttribute('href'))
        )
      ).sort()
    ).toEqual(
      giveaways
        .slice(0, 2)
        .map(({ id }) => `/browse/${id}`)
        .sort()
    );

    await expectNotInPayload(
      request,
      `/winners?search=${ns}`,
      Object.fromEntries(users.map(({ persona, email }) => [persona, email]))
    );

    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(page).toHaveURL(/\/winners$/);
  });
});
