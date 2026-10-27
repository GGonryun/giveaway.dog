import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BONUS = 'Claim a free entry';
const INSTAGRAM = 'Visit our Instagram profile';
const PROFILE_URL = 'https://www.instagram.com/giveawaydog/';
const QUESTION = 'What is your Instagram profile link?';

const answerInstagram = async (page: Page, link: string) => {
  await page.getByRole('heading', { name: INSTAGRAM }).click();
  const popup = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Visit @giveawaydog' }).click();
  await (await popup).close();
  await page.getByLabel(QUESTION).fill(link);
};

test.describe('updating a submitted answer', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  let ns = '';

  test.beforeEach(async ({ page, request, freshPersona }, testInfo) => {
    ({ ns } = await freshPersona('participant'));
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
      ]
    });
    const { team } = await seedWorkerTeam(request, testInfo);
    const { id } = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
      tasks: [
        { type: 'BONUS_TASK', title: BONUS },
        { type: 'INSTAGRAM_VISIT', title: INSTAGRAM, profileUrl: PROFILE_URL }
      ]
    });
    await page
      .context()
      .route('https://www.instagram.com/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: '' })
      );

    await page.goto(`/browse/${id}`);
    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();
    await page.reload();

    await answerInstagram(page, `https://www.instagram.com/e2e${ns}`);
    await page.getByRole('button', { name: 'Complete Task' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();
    await page.reload();
    await expect(page.getByText('2/2 completed')).toBeVisible();
  });

  test(
    'a participant sees the profile link they submitted',
    knownBug(588),
    async ({ page }) => {
      await page.getByRole('heading', { name: INSTAGRAM }).click();
      await expect(page.getByLabel(QUESTION)).toHaveValue(
        `https://www.instagram.com/e2e${ns}`
      );
    }
  );

  test(
    'a participant updates the profile link after completing another task',
    knownBug(589),
    async ({ page }) => {
      const updated = `https://www.instagram.com/e2e${ns}_new`;
      await answerInstagram(page, updated);
      await page.getByRole('button', { name: 'Update Task' }).click();

      await expect(page.getByText('Task updated!')).toBeVisible();
    }
  );
});
