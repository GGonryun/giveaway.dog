import { test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../env';
import { expectNotInPayload } from '../helpers/leaks';
import { toPersonaEmail } from '../helpers/personas';

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
