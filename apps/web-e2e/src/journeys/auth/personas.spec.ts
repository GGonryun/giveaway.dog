import type { Page } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { PERSONAS, toPersonaEmail } from '../../helpers/personas';

const expectTeamPicker = async (page: Page) => {
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText('Choose Your Team')).toBeVisible();
};

const expectBrowse = async (page: Page) => {
  await expect(page).toHaveURL(/\/browse$/);
  await expect(
    page.getByRole('searchbox', { name: /Search giveaways/ })
  ).toBeVisible();
};

const expectOnboarding = async (page: Page) => {
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText('Welcome to Giveaway.dog')).toBeVisible();
};

const LANDINGS: Record<E2ePersona, (page: Page) => Promise<void>> = {
  host: expectTeamPicker,
  host2: expectTeamPicker,
  admin: expectTeamPicker,
  member: expectTeamPicker,
  guest: expectTeamPicker,
  blocked: expectTeamPicker,
  participant: expectBrowse,
  participant2: expectBrowse,
  newbie: expectOnboarding
};

test.describe('personas', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  for (const persona of PERSONAS) {
    test.describe(persona, () => {
      test.use({ storageState: personaState(persona) });

      test(`lands where ${persona} belongs`, async ({ page }) => {
        const session = await page.request.get('/api/auth/session');
        const { user } = await session.json();
        expect(user.email).toBe(toPersonaEmail(persona, RUN_ID));

        await page.goto('/');

        await LANDINGS[persona](page);
      });
    });
  }

  test('gives a test its own user for each fresh persona', async ({
    page,
    freshPersona
  }) => {
    const first = await freshPersona('newbie');
    const second = await freshPersona('newbie');

    expect(first.ns).toMatch(new RegExp(`^${RUN_ID}[a-z0-9]{4}$`));
    expect(second.ns).not.toBe(first.ns);
    expect(second.id).not.toBe(first.id);

    await page.goto('/');

    await expectOnboarding(page);
  });
});
