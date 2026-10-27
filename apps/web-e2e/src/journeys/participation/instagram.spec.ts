import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE, E2E_SECRET, RUN_ID } from '../../env';
import { signInAs } from '../../helpers/personas';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { blockThirdParties } from '../../helpers/third-party';

const BONUS = 'Claim a free entry';

const linkInstagram = async (page: Page, path: string, profile: string) => {
  await page.goto(path);
  await page.getByRole('heading', { name: BONUS }).click();
  await page.getByRole('button', { name: 'Instagram' }).click();
  await page.getByLabel('Instagram Profile URL').fill(profile);
  await page.getByRole('button', { name: 'Connect' }).click();
};

test.describe('an Instagram profile link', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a participant links an Instagram profile to enter, and a second participant cannot link it again', async ({
    page,
    request,
    browser,
    freshPersona
  }, testInfo) => {
    const { ns } = await freshPersona('participant');
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: { allowedIdentities: ['INSTAGRAM'], formFields: [] },
      tasks: [{ type: 'BONUS_TASK', title: BONUS }]
    });
    const path = `/browse/${giveaway.id}`;
    const profile = `https://instagram.com/e2e${ns}`;

    await linkInstagram(page, path, profile);
    await expect(page.getByLabel('Instagram Profile URL')).toBeHidden();
    await page.goto(path);
    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();
    await page.goto(path);
    await expect(page.getByText('Your entries: 1')).toBeVisible();

    const context = await browser.newContext({ storageState: BYPASS_STATE });
    await blockThirdParties(context);
    const other = await context.newPage();
    await signInAs(other.request, 'participant2', ns);

    await linkInstagram(other, path, profile);
    await expect(
      other.getByText(
        'This Instagram profile is already linked to another account.'
      )
    ).toBeVisible();
    await other.goto(path);
    await other.getByRole('heading', { name: BONUS }).click();
    await expect(other.getByRole('button', { name: 'Continue' })).toBeHidden();
    await context.close();
  });
});
