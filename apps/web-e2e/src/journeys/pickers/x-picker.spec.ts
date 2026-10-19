import {
  E2E_X_FIXTURES,
  toE2eXFixtureRetweeterUsername
} from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET } from '../../env';
import { fakesOf } from '../../helpers/outbox';
import { seedApi } from '../../helpers/seed';

const postUrl = (id: string) =>
  `https://x.com/${E2E_X_FIXTURES.author}/status/${id}`;

const RETWEETER = new RegExp(
  `^@${toE2eXFixtureRetweeterUsername(0).replace(/0$/, '(\\d+)')}$`
);

const isEligible = (index: number) => index % 5 >= 3 && index % 3 !== 0;

test.describe('free X picker on the ScrapeBadger fixtures', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to read the fakes');

  test.beforeEach(async ({ request }) => {
    const fakes = fakesOf(await seedApi(request).health());
    test.skip(
      !fakes.includes('scrapebadger'),
      'Set E2E_FAKE_EXTERNALS to scrapebadger'
    );
  });

  test('picks winners who pass the filters', async ({ page }) => {
    await page.goto('/pickers/x');
    await page
      .getByRole('textbox', { name: 'Post URL' })
      .fill(postUrl(E2E_X_FIXTURES.tweet));
    await page.getByRole('button', { name: 'Load Tweet' }).click();

    await expect(page.getByText(`@${E2E_X_FIXTURES.author}`)).toBeVisible();
    await expect(
      page.getByText(`The e2e fixture tweet ${E2E_X_FIXTURES.tweet}`)
    ).toBeVisible();

    await page.getByRole('spinbutton', { name: 'Number of Winners' }).fill('3');
    for (const name of [
      'Minimum Post Count',
      'Minimum Followers',
      'Minimum Following'
    ]) {
      await page.getByRole('spinbutton', { name }).clear();
    }
    await page
      .getByRole('spinbutton', { name: 'Account Age (Days)' })
      .fill('300');
    await expect(
      page.getByRole('switch', { name: 'Profile Image' })
    ).toBeChecked();

    await page.getByRole('button', { name: 'Pick Winners' }).click();

    const dialog = page.getByRole('dialog', { name: 'Winners', exact: true });
    const links = dialog.getByRole('link', { name: RETWEETER });
    await expect(links).toHaveCount(3, { timeout: 30_000 });
    const winners = await links.allTextContents();
    for (const winner of winners) {
      const index = Number(winner.match(RETWEETER)![1]);
      expect(isEligible(index), `${winner} passes the filters`).toBe(true);
    }
  });

  test.describe(() => {
    test.use({
      allowedPageErrors: [/Failed to load resource: .* status of 500/]
    });

    test('shows an error for a post that does not exist', async ({ page }) => {
      await page.goto('/pickers/x');
      await page
        .getByRole('textbox', { name: 'Post URL' })
        .fill(postUrl(E2E_X_FIXTURES.tweetNotFound));
      await page.getByRole('button', { name: 'Load Tweet' }).click();

      await expect(
        page.getByText('An unexpected error occurred')
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Load Tweet' })
      ).toBeEnabled();
      await expect(
        page.getByRole('button', { name: 'Pick Winners' })
      ).toHaveCount(0);
    });
  });
});
