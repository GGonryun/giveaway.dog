import type { APIRequestContext, Page, TestInfo } from '@playwright/test';
import type { E2eSweepstakesRequestInput } from '@giveaway/e2e-model/requests';
import { expect, test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../env';
import { knownBug } from '../helpers/known-bug';
import {
  captureServerAction,
  readActionResult,
  replayServerAction
} from '../helpers/rsc';
import { seedApi, seedWorkerTeam } from '../helpers/seed';

type Completions = { byStatus: Record<string, number> };

const BONUS = 'Free bonus';

const OPEN_AUDIENCE = {
  formFields: [],
  allowedIdentities: ['GOOGLE', 'ANONYMOUS']
} satisfies E2eSweepstakesRequestInput['audience'];

const BLOCKED: {
  name: string;
  giveaway: Omit<E2eSweepstakesRequestInput, 'ns' | 'team'>;
  refusal?: RegExp;
  bug?: number;
}[] = [
  {
    name: 'a region that the participant is not in',
    giveaway: {
      audience: {
        ...OPEN_AUDIENCE,
        regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' }
      }
    },
    bug: 442
  },
  {
    name: 'an identity that the participant has not connected',
    giveaway: {
      audience: { ...OPEN_AUDIENCE, allowedIdentities: ['DISCORD'] }
    },
    bug: 442
  },
  {
    name: 'a required age that the participant has not confirmed',
    giveaway: {
      audience: {
        allowedIdentities: OPEN_AUDIENCE.allowedIdentities,
        formFields: [
          {
            type: 'AGE',
            label: 'I am at least 18',
            required: true,
            minimum: 18
          }
        ]
      }
    },
    bug: 442
  },
  {
    name: 'a giveaway that has not started',
    giveaway: { preset: 'scheduled', startsIn: 3600, audience: OPEN_AUDIENCE },
    refusal: /has not started yet/
  },
  {
    name: 'a giveaway that has ended',
    giveaway: { preset: 'ended', audience: OPEN_AUDIENCE },
    refusal: /has ended/
  }
];

const seedGiveaway = async (
  request: APIRequestContext,
  testInfo: TestInfo,
  giveaway: Omit<E2eSweepstakesRequestInput, 'ns' | 'team'>
) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  return seedApi(request).sweepstakes({
    ns: RUN_ID,
    team: team.slug,
    tasks: [{ type: 'BONUS_TASK', title: BONUS }],
    ...giveaway
  });
};

const completedEntries = async (request: APIRequestContext, id: string) =>
  (await seedApi(request).rows<Completions>({ view: 'completions', id }))
    .byStatus.COMPLETED ?? 0;

const captureEntryAction = async (
  page: Page,
  request: APIRequestContext,
  testInfo: TestInfo
) => {
  const open = await seedGiveaway(request, testInfo, {
    audience: OPEN_AUDIENCE
  });

  await page.goto(`/browse/${open.id}`);
  await page.getByRole('heading', { name: BONUS }).click();
  const action = await captureServerAction(page, () =>
    page.getByRole('button', { name: 'Continue' }).click()
  );

  await expect
    .poll(() => completedEntries(request, open.id), {
      message: 'The participant could not enter the open giveaway'
    })
    .toBe(1);
  return action;
};

test.describe('entry rules on the server', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  for (const blocked of BLOCKED) {
    test(
      `[ENTRY-004] a participant cannot enter ${blocked.name} with a direct call`,
      blocked.bug ? knownBug(blocked.bug) : {},
      async ({ page, request, freshPersona }, testInfo) => {
        const { ns } = await freshPersona('participant');
        await seedApi(request).userExtras({
          ns: RUN_ID,
          users: [
            { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
          ]
        });
        const action = await captureEntryAction(page, request, testInfo);
        const giveaway = await seedGiveaway(
          request,
          testInfo,
          blocked.giveaway
        );

        const result = readActionResult(
          await replayServerAction(page, action, [
            { taskId: giveaway.tasks[0].id, sweepstakesId: giveaway.id }
          ])
        );

        expect(result.ok, JSON.stringify(result)).toBe(false);
        if (blocked.refusal && !result.ok) {
          expect(result.data.message).toMatch(blocked.refusal);
        }
        expect(await completedEntries(request, giveaway.id)).toBe(0);
      }
    );
  }
});
