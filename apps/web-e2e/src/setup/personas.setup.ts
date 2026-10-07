import { test as setup } from '@playwright/test';
import { E2E_SECRET, personaState } from '../env';
import { PERSONAS, signInAs } from '../helpers/personas';

setup.describe('sign in the personas', () => {
  setup.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  for (const persona of PERSONAS) {
    setup(`sign in ${persona}`, async ({ request }) => {
      await signInAs(request, persona);
      await request.storageState({ path: personaState(persona) });
    });
  }
});
