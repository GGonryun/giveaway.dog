import type { APIRequestContext, TestInfo } from '@playwright/test';
import type { E2eSweepstakesRequestInput } from '@giveaway/e2e-model/requests';
import { expect, test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../env';
import { noRedirect } from '../helpers/http';
import { knownBug } from '../helpers/known-bug';
import {
  freshSlug,
  seedApi,
  seedWorkerTeam,
  type SeededSweepstakes
} from '../helpers/seed';

type Participants = { participants: { email: string | null }[] };

const BOT_USER_AGENT = 'Twitterbot/1.0';

const HIDDEN: {
  kind: string;
  giveaway: (
    testInfo: TestInfo
  ) => Omit<E2eSweepstakesRequestInput, 'ns' | 'team'>;
  pageBug?: number;
  metadataBug?: number;
}[] = [
  {
    kind: 'private',
    giveaway: (testInfo) => ({
      visibility: 'PRIVATE',
      slug: freshSlug(testInfo),
      tasks: [{ type: 'BONUS_COMPLETE_PROFILE' }, { type: 'BONUS_TASK' }],
      audience: { formFields: [] }
    }),
    metadataBug: 444
  },
  {
    kind: 'draft',
    giveaway: (testInfo) => ({
      preset: 'draft',
      slug: freshSlug(testInfo),
      tasks: [{ type: 'SECRET_CODE', code: `E2E-DRAFT-${freshSlug(testInfo)}` }]
    }),
    pageBug: 443,
    metadataBug: 444
  }
];

const seedHidden = async (
  request: APIRequestContext,
  testInfo: TestInfo,
  giveaway: Omit<E2eSweepstakesRequestInput, 'ns' | 'team'>
) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  const description = `The description of ${freshSlug(testInfo)}`;
  return {
    description,
    ...(await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      description,
      ...giveaway
    }))
  };
};

type HiddenGiveaway = Awaited<ReturnType<typeof seedHidden>>;

const pagesOf = (giveaway: SeededSweepstakes) => [
  `/browse/${giveaway.id}`,
  `/browse/${giveaway.slug}`
];

const expectNotFound = async (
  request: APIRequestContext,
  giveaway: SeededSweepstakes,
  headers: Record<string, string> = {}
) => {
  for (const page of pagesOf(giveaway)) {
    const response = await request.get(page, { ...noRedirect, headers });
    expect(response.status(), `GET ${page}`).toBe(404);
  }
};

const expectNoMetadata = async (
  request: APIRequestContext,
  giveaway: HiddenGiveaway
) => {
  for (const page of pagesOf(giveaway)) {
    const response = await request.get(page, {
      ...noRedirect,
      headers: { 'User-Agent': BOT_USER_AGENT }
    });
    const head = (await response.text()).split('</head>')[0];

    expect(response.status(), `GET ${page} as a bot`).toBe(404);
    for (const [name, value] of Object.entries({
      name: giveaway.name,
      description: giveaway.description,
      banner: 'demo-sweepstakes-banner'
    })) {
      expect(
        head.includes(value),
        `The <head> of ${page} has its ${name}`
      ).toBe(false);
    }
  }
};

test.describe('hidden giveaways', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  for (const hidden of HIDDEN) {
    test.describe(`a ${hidden.kind} giveaway`, () => {
      test(
        '[VIS-001] is not found for a visitor',
        hidden.pageBug ? knownBug(hidden.pageBug) : {},
        async ({ request }, testInfo) => {
          const giveaway = await seedHidden(
            request,
            testInfo,
            hidden.giveaway(testInfo)
          );

          await expectNotFound(request, giveaway);
        }
      );

      test(
        '[VIS-003] gives a bot no metadata',
        hidden.metadataBug ? knownBug(hidden.metadataBug) : {},
        async ({ request }, testInfo) => {
          const giveaway = await seedHidden(
            request,
            testInfo,
            hidden.giveaway(testInfo)
          );

          await expectNoMetadata(request, giveaway);
        }
      );

      test.describe('as a participant who is not a member', () => {
        test.use({ storageState: personaState('participant') });

        test(
          '[VIS-001] is not found',
          hidden.pageBug ? knownBug(hidden.pageBug) : {},
          async ({ request }, testInfo) => {
            const giveaway = await seedHidden(
              request,
              testInfo,
              hidden.giveaway(testInfo)
            );

            await expectNotFound(request, giveaway);
          }
        );
      });
    });
  }

  test.describe('as the host', () => {
    test.use({ storageState: personaState('host') });

    test('[VIS-002] a private giveaway opens for a member of its team', async ({
      request
    }, testInfo) => {
      const giveaway = await seedHidden(
        request,
        testInfo,
        HIDDEN[0].giveaway(testInfo)
      );

      for (const page of pagesOf(giveaway)) {
        const response = await request.get(page, noRedirect);
        expect(response.status(), `GET ${page}`).toBe(200);
        expect(await response.text()).toContain(giveaway.name);
      }
    });
  });
});

test.describe('opening a giveaway page', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  const CLOSED: {
    kind: string;
    giveaway: (
      testInfo: TestInfo
    ) => Omit<E2eSweepstakesRequestInput, 'ns' | 'team'>;
  }[] = [
    ...HIDDEN,
    {
      kind: 'scheduled',
      giveaway: () => ({ preset: 'scheduled', startsIn: 3600 })
    },
    { kind: 'ended', giveaway: () => ({ preset: 'ended' }) }
  ];

  for (const closed of CLOSED) {
    test(
      `[VIS-004] makes no participant of a visitor of a ${closed.kind} giveaway`,
      knownBug(445),
      async ({ page, request, freshPersona }, testInfo) => {
        const { email } = await freshPersona('participant');
        const giveaway = await seedHidden(
          request,
          testInfo,
          closed.giveaway(testInfo)
        );

        await page.request.get(`/browse/${giveaway.id}`, noRedirect);

        const { participants } = await seedApi(request).rows<Participants>({
          view: 'participants',
          id: giveaway.id
        });
        expect(
          participants.map((participant) => participant.email)
        ).not.toContain(email);
      }
    );
  }
});
