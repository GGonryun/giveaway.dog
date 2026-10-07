import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { expectAfterReloads } from '../../helpers/poll';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const STARTS_IN_SECONDS = 10;

test.describe('a scheduled giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('participant') });

  test('opens after it starts', async ({ page, request }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      preset: 'scheduled',
      startsIn: STARTS_IN_SECONDS
    });
    const name = page.getByRole('heading', { name: giveaway.name, level: 1 });
    const pending = page.getByRole('heading', {
      name: /^Giveaway (Starting Soon|Has Started!)$/
    });

    await page.goto(`/browse/${giveaway.id}`);
    await expect(name).toBeVisible();
    await expect(pending).toHaveText('Giveaway Starting Soon');

    await expect(pending).toHaveText('Giveaway Has Started!', {
      timeout: (STARTS_IN_SECONDS + 5) * 1000
    });
    await page.getByRole('button', { name: 'Refresh Page' }).click();

    await expectAfterReloads(page, async () => {
      await expect(name).toBeVisible();
      await expect(pending).toBeHidden();
    });
  });
});
