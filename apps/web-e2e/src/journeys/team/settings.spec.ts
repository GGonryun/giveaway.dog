import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';

const seedOwnTeam = async (page: Page, ns: string, suffix: string) => {
  const { team } = await seedApi(page.request).team({
    ns,
    suffix,
    name: `Team ${suffix}`
  });
  await signInAs(page.request, 'host', ns);
  return team;
};

const urlField = (page: Page) =>
  page.getByRole('textbox', { name: 'https://x.com/username' });

const addSocialLink = async (page: Page, slug: string) => {
  await page.goto(`/app/${slug}/settings/socials`);
  await expect(async () => {
    if ((await urlField(page).count()) === 0) {
      await page.getByRole('button', { name: 'Add Social Link' }).click();
    }
    await expect(urlField(page)).toBeVisible({ timeout: 1_000 });
  }).toPass();
  return urlField(page);
};

test.describe('team settings', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({
    allowedPageErrors: [/didn't match the client properties|ClientFetchError/]
  });

  test('an owner renames the team, and the new name shows everywhere', async ({
    page
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const team = await seedOwnTeam(page, ns, 'nm');
    const renamed = `Renamed ${ns}`;

    await page.goto(`/app/${team.slug}/settings`);
    await expect(page).toHaveURL(/\/settings\/profile$/);
    await expect(page.locator('#team-slug')).toBeDisabled();
    await expect(page.locator('#team-slug')).toHaveValue(team.slug);

    const name = page.getByRole('textbox', { name: 'My Team' });
    const save = page.getByRole('button', { name: 'Save' }).first();
    await expect(async () => {
      await name.fill('');
      await expect(name).toHaveValue('', { timeout: 1_000 });
      await expect(save).toBeDisabled({ timeout: 1_000 });
    }).toPass();
    await name.fill(renamed);
    await expect(save).toBeEnabled();
    await save.click();

    await expect(
      page.getByText('Team name updated successfully')
    ).toBeVisible();
    await expect(
      page.locator('[data-sidebar="menu-button"]').filter({ hasText: renamed })
    ).toBeVisible();
    await expect(save).toBeDisabled();

    await page.reload();
    await expect(name).toHaveValue(renamed);
    await page.goto('/app?step=1');
    await expect(
      page.getByRole('button').filter({ hasText: renamed })
    ).toContainText(`@${team.slug}`);
  });

  test('an owner saves and removes a social link', async ({
    page
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const team = await seedOwnTeam(page, ns, 'soc');
    const save = page.getByRole('button', { name: 'Save' });

    const url = await addSocialLink(page, team.slug);
    await url.fill('not a url');
    await save.click();
    await expect(page.getByText('Must be a valid URL')).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('No social links added yet', { exact: false })
    ).toBeVisible();

    await (await addSocialLink(page, team.slug)).fill('https://x.com/e2e');
    await save.click();
    await expect(
      page.getByText('Social links updated successfully')
    ).toBeVisible();
    await page.reload();
    await expect(urlField(page)).toHaveValue('https://x.com/e2e');

    await page
      .locator('form')
      .filter({ has: urlField(page) })
      .getByRole('button')
      .first()
      .click();
    await expect(
      page.getByText('No social links added yet', { exact: false })
    ).toBeVisible();
    await save.click();
    await expect(
      page.getByText('Social links updated successfully')
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('No social links added yet', { exact: false })
    ).toBeVisible();
  });

  test(
    'Enter in a social link field saves the links',
    knownBug(84),
    async ({ page }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const team = await seedOwnTeam(page, ns, 'ent');

      const url = await addSocialLink(page, team.slug);
      await url.fill('https://x.com/e2e');
      await url.press('Enter');

      await expect(
        page.getByText('Social links updated successfully')
      ).toBeVisible();
      await expect(page).not.toHaveURL(/links/);
    }
  );

  test(
    'the integrations page shows only the messages of the app',
    knownBug(490),
    async ({ page }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const team = await seedOwnTeam(page, ns, 'int');

      await page.goto(
        `/app/${team.slug}/settings/integrations?${new URLSearchParams({ error: 'Your account is suspended' })}`
      );
      const alert = page.locator('[data-slot="alert"]');
      await expect(alert).toBeVisible();
      await expect(alert).not.toContainText('Your account is suspended');
    }
  );
});
