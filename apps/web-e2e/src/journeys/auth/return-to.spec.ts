import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, RUN_ID } from '../../env';
import {
  requestMagicLink,
  skipWithoutEmailFake
} from '../../helpers/magic-link';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

test.describe('return after sign-in', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[AUTH-007] a visitor returns to the page they asked for after signing in', async ({
    page,
    request
  }, testInfo) => {
    await skipWithoutEmailFake(request);
    const {
      users: [{ email }]
    } = await seedApi(request).userExtras({
      ns: freshNamespace(testInfo.workerIndex),
      users: [{ persona: 'participant' }]
    });

    await page.goto('/account/history');
    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    const link = await requestMagicLink(page, request, email);
    await page.goto(link);

    await expect(page).toHaveURL(/\/account\/history$/);
  });

  test('[AUTH-016] a participant whose sign-in ends on a giveaway lands on it', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug
    });
    await freshPersona('participant');

    await page.goto(
      `/portal?${new URLSearchParams({ redirectTo: `/browse/${giveaway.id}` })}`
    );

    const giveawayUrl = new RegExp(`/browse/${giveaway.id}$`);
    await expect(page).toHaveURL(giveawayUrl, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(giveawayUrl);
  });
});
