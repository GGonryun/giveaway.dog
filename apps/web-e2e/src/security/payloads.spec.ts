import type { APIRequestContext, TestInfo } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { freshNamespace } from '../fixtures/personas';
import { E2E_SECRET, RUN_ID, personaState } from '../env';
import { expectNotInPayload } from '../helpers/leaks';
import { noRedirect } from '../helpers/http';
import { toPersonaEmail } from '../helpers/personas';
import { freshSlug, seedApi, seedWorkerTeam } from '../helpers/seed';

test.describe('page payloads', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ storageState: personaState('participant') });

  for (const path of ['/browse', '/account']) {
    test(`${path} sends a participant no other user's email`, async ({
      request
    }) => {
      await expectNotInPayload(request, path, {
        "the host's email": toPersonaEmail('host', RUN_ID),
        "the other participant's email": toPersonaEmail('participant2', RUN_ID)
      });
    });
  }
});

test.describe('giveaway page payloads', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a giveaway page sends a visitor no email of the host', async ({
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug
    });

    await expectNotInPayload(request, `/browse/${giveaway.id}`, {
      "the host's email": giveaway.owner
    });
  });
});

test.describe('secret-code task payloads', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  const CODES = {
    'the code of the SECRET_CODE task': 'OPEN-SESAME-42',
    'the first code of the SECRET_CODE_V2 task': 'FIRST-CODE-77',
    'the second code of the SECRET_CODE_V2 task': 'SECOND-CODE-88'
  };

  const seedSecretCodeGiveaway = async (
    request: APIRequestContext,
    testInfo: TestInfo
  ) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    return seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      tasks: [
        {
          type: 'SECRET_CODE',
          code: CODES['the code of the SECRET_CODE task']
        },
        {
          type: 'SECRET_CODE_V2',
          codes: [
            CODES['the first code of the SECRET_CODE_V2 task'],
            CODES['the second code of the SECRET_CODE_V2 task']
          ]
        }
      ]
    });
  };

  test('a giveaway page sends a visitor no secret code', async ({
    request
  }, testInfo) => {
    const giveaway = await seedSecretCodeGiveaway(request, testInfo);

    await expectNotInPayload(request, `/browse/${giveaway.id}`, CODES);
  });

  test.describe('as a participant', () => {
    test.use({ storageState: personaState('participant') });

    test('a giveaway page sends a participant no secret code', async ({
      request
    }, testInfo) => {
      const giveaway = await seedSecretCodeGiveaway(request, testInfo);

      await expectNotInPayload(request, `/browse/${giveaway.id}`, CODES);
    });
  });
});

test.describe('winner payloads', { tag: '@security' }, () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  const WINNER_NAME = 'E2E participant';

  const seedPersonalData = async (
    request: APIRequestContext,
    persona: 'participant' | 'participant2',
    ns: string,
    birthday: string
  ) => {
    const label = `e2e-google-${ns}`;
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        {
          persona,
          ns,
          birthday,
          location: { country: 'Iceland', countryCode: 'IS' },
          accounts: [{ identity: 'GOOGLE', label }]
        }
      ]
    });
    return {
      [`the email of ${persona}`]: toPersonaEmail(persona, ns),
      [`the birthday of ${persona}`]: birthday,
      [`the Google label of ${persona}`]: label
    };
  };

  const seedCompletedGiveaway = async (
    request: APIRequestContext,
    testInfo: TestInfo
  ) => {
    const winnerNs = freshNamespace(testInfo.workerIndex);
    const disqualifiedNs = freshNamespace(testInfo.workerIndex);
    const secrets = {
      ...(await seedPersonalData(
        request,
        'participant',
        winnerNs,
        '1990-04-17'
      )),
      ...(await seedPersonalData(
        request,
        'participant2',
        disqualifiedNs,
        '1985-11-23'
      ))
    };
    const code = `E2E-SECRET-${winnerNs}`;
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      preset: 'completed',
      slug: freshSlug(testInfo),
      tasks: [{ type: 'SECRET_CODE_V2', codes: [code] }],
      prizes: [{ name: 'Prize', quota: 2 }],
      entries: [
        { persona: 'participant', ns: winnerNs, completions: [{ task: 0 }] },
        {
          persona: 'participant2',
          ns: disqualifiedNs,
          completions: [{ task: 0 }]
        }
      ],
      draws: [
        { entry: 0, prize: 0 },
        {
          entry: 1,
          prize: 0,
          result: 'DISQUALIFIED',
          reason: 'Duplicate account'
        }
      ]
    });
    return {
      giveaway,
      secrets: {
        ...secrets,
        'the secret code': code,
        'a country of a winner': '"countryCode":"IS"'
      }
    };
  };

  const pagesOf = (giveaway: { id: string; slug: string | null }) => [
    `/browse/${giveaway.id}`,
    `/browse/${giveaway.slug}`
  ];

  test('a completed giveaway sends a visitor no personal data of its winners', async ({
    request
  }, testInfo) => {
    const { giveaway, secrets } = await seedCompletedGiveaway(
      request,
      testInfo
    );

    for (const page of pagesOf(giveaway)) {
      await expectNotInPayload(request, page, secrets);
    }

    const response = await request.get(pagesOf(giveaway)[0], {
      ...noRedirect,
      headers: { RSC: '1' }
    });
    expect(await response.text()).toContain(`"name":"${WINNER_NAME}"`);
  });

  test.describe('as a participant', () => {
    test.use({ storageState: personaState('participant') });

    test('a completed giveaway sends a participant no personal data of its winners', async ({
      request
    }, testInfo) => {
      const { giveaway, secrets } = await seedCompletedGiveaway(
        request,
        testInfo
      );

      for (const page of pagesOf(giveaway)) {
        await expectNotInPayload(request, page, secrets);
      }
    });
  });
});
