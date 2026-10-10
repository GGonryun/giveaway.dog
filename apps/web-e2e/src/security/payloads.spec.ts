import type { APIRequestContext, TestInfo } from '@playwright/test';
import { test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../env';
import { expectNotInPayload } from '../helpers/leaks';
import { toPersonaEmail } from '../helpers/personas';
import { seedApi, seedWorkerTeam } from '../helpers/seed';

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
