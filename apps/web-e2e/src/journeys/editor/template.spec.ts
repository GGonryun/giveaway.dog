import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import {
  addPrize,
  giveawayName,
  openAsVisitor,
  openStep,
  publishNow,
  setTiming
} from '../../helpers/editor';
import { seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const useBasicTemplate = async (page: Page, team: string) => {
  await page.goto(`/app/${team}/templates`);
  await page.getByText('Basic Giveaway', { exact: true }).first().click();
  await page
    .getByRole('dialog', { name: 'Basic Giveaway' })
    .getByRole('button', { name: 'Use Template' })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/app/${team}/sweepstakes/[A-Za-z0-9_-]{6}/create$`),
    { timeout: 30_000 }
  );
  return new URL(page.url()).pathname.split('/')[4];
};

test.describe('create a giveaway from a template', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    storageState: personaState('host'),
    timezoneId: 'America/New_York'
  });

  test(
    'a host publishes the Basic Giveaway template without uploading a banner',
    { tag: TAGS.slow },
    async ({ page, request, browser }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const id = await useBasicTemplate(page, team.slug);

      const nameField = page.getByRole('textbox', { name: 'Name' });
      await expect(nameField).toHaveValue('My Giveaway');
      await expect(page.getByRole('img', { name: 'Preview' })).toBeVisible();
      const name = giveawayName(testInfo, 'template');
      await nameField.fill(name);
      await setTiming(page, { startsIn: -1, endsIn: 10 });
      await openStep(page, 'Tasks');
      await expect(page.getByText('Visit URL', { exact: true })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Visit our website' })
      ).toBeVisible();
      await openStep(page, 'Prizes');
      await addPrize(page);
      await publishNow(page, team.slug, /go live immediately/);

      const visitor = await openAsVisitor(browser, `/browse/${id}`);
      await expect(
        visitor.page.getByRole('heading', { name, level: 1 })
      ).toBeVisible();
      await expect(visitor.page.getByRole('img', { name })).toBeVisible();
      await expect(visitor.page.getByText('Visit our website')).toBeVisible();
      await visitor.context.close();
    }
  );

  test("a giveaway made from a template keeps the host's time zone", async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    await useBasicTemplate(page, team.slug);

    await expect(
      page.getByRole('combobox', { name: 'Timezone' })
    ).toContainText('New York');
  });
});
