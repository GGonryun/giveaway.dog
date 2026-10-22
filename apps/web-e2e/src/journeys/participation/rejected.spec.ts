import type { APIRequestContext, TestInfo } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const QUESTION = 'Tell us about your setup';
const BONUS = 'Claim a free entry';

const seedRejectedAnswer = async (
  request: APIRequestContext,
  testInfo: TestInfo,
  ns: string
) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  return seedApi(request).sweepstakes({
    ns: RUN_ID,
    team: team.slug,
    audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
    tasks: [
      {
        type: 'ASK_QUESTION',
        title: QUESTION,
        question: 'Which keyboard do you use?',
        value: 2
      },
      { type: 'BONUS_TASK', title: BONUS }
    ],
    entries: [
      {
        persona: 'participant',
        ns,
        completions: [
          {
            task: 0,
            status: 'REJECTED',
            proof: { answer: 'Not telling' },
            reason: 'The answer does not name a keyboard'
          },
          { task: 1 }
        ]
      }
    ]
  });
};

test.describe('a rejected submission', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test.beforeEach(async ({ request, freshPersona }, testInfo) => {
    const { ns } = await freshPersona('participant');
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
      ]
    });
    testInfo.annotations.push({ type: 'ns', description: ns });
  });

  const nsOf = (testInfo: TestInfo) =>
    testInfo.annotations.find(({ type }) => type === 'ns')!.description!;

  test('a participant sees that a submission was rejected and cannot submit it again', async ({
    page,
    request
  }, testInfo) => {
    const giveaway = await seedRejectedAnswer(
      request,
      testInfo,
      nsOf(testInfo)
    );

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText('1/2 completed')).toBeVisible();
    await page.getByRole('heading', { name: QUESTION }).click();

    await expect(
      page.getByRole('tooltip', { name: 'Your submission was rejected.' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Submit Answer' })
    ).toBeHidden();
  });

  test(
    'a participant keeps no entries from a rejected submission',
    knownBug(522),
    async ({ page, request }, testInfo) => {
      const giveaway = await seedRejectedAnswer(
        request,
        testInfo,
        nsOf(testInfo)
      );

      await page.goto(`/browse/${giveaway.id}`);

      await expect(page.getByText('Your entries: 1')).toBeVisible();
    }
  );
});
