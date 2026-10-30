import type { Page } from '@playwright/test';
import { E2E_X_FIXTURES } from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import {
  FIXTURE_RETWEETER,
  LOAD_TWEET_PATH,
  clearNumberFilters,
  expectRetweeters,
  fixturePostUrl,
  loadFixtureTweet,
  skipWithoutScrapeBadgerFixtures,
  statValue,
  useCreditPool
} from '../../helpers/pickers';

const isEligible = (index: number) => index % 5 >= 3 && index % 3 !== 0;

type OpenedWindows = { e2eOpened: string[] };

const stubWindowOpen = (page: Page) =>
  page.addInitScript(() => {
    const target = globalThis as unknown as OpenedWindows & {
      open: (url?: string | URL) => null;
    };
    target.e2eOpened = [];
    target.open = (url) => {
      target.e2eOpened.push(String(url));
      return null;
    };
  });

const openedWindows = (page: Page) =>
  page.evaluate(() => (globalThis as unknown as OpenedWindows).e2eOpened);

const drawIdOf = async (page: Page) => {
  const link = page.getByRole('link', { name: /^Verify the Draw: / });
  return (await link.textContent())!.replace('Verify the Draw: ', '').trim();
};

test.describe('free X picker on the ScrapeBadger fixtures', () => {
  skipWithoutScrapeBadgerFixtures();

  test.beforeEach(async ({ context }, testInfo) => {
    await useCreditPool(context, testInfo);
  });

  test('picks winners who pass the filters', async ({ page }) => {
    await page.goto('/pickers/x');
    await loadFixtureTweet(page, fixturePostUrl(E2E_X_FIXTURES.tweet));

    await expect(page.getByText(`@${E2E_X_FIXTURES.author}`)).toBeVisible();
    await expect(
      page.getByText(`The e2e fixture tweet ${E2E_X_FIXTURES.tweet}`)
    ).toBeVisible();

    await page.getByRole('spinbutton', { name: 'Number of Winners' }).fill('3');
    await clearNumberFilters(page);
    await page
      .getByRole('spinbutton', { name: 'Account Age (Days)' })
      .fill('300');
    await expect(
      page.getByRole('switch', { name: 'Profile Image' })
    ).toBeChecked();
    await expect(page.getByRole('switch', { name: 'Last Post' })).toHaveCount(
      0
    );

    await page.getByRole('button', { name: 'Pick Winners' }).click();

    const dialog = page.getByRole('dialog', { name: 'Winners', exact: true });
    const winners = await expectRetweeters(
      dialog.getByRole('link', { name: FIXTURE_RETWEETER }),
      3
    );
    for (const winner of winners) {
      const index = Number(winner.match(FIXTURE_RETWEETER)![1]);
      expect(isEligible(index), `${winner} passes the filters`).toBe(true);
    }
  });

  test('a visitor loads a post, picks winners and opens the shared verification page', async ({
    page
  }) => {
    const postUrl = fixturePostUrl(E2E_X_FIXTURES.tweet);
    await stubWindowOpen(page);
    await page.goto('/pickers/x');
    await expect(
      page.getByRole('heading', { level: 1, name: 'X (Twitter) Picker' })
    ).toBeVisible();

    await loadFixtureTweet(page, postUrl);
    await expect(page.getByText(`@${E2E_X_FIXTURES.author}`)).toBeVisible();
    await expect(
      page.getByText(`The e2e fixture tweet ${E2E_X_FIXTURES.tweet}`)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Change' })).toBeVisible();

    await page.getByRole('spinbutton', { name: 'Number of Winners' }).fill('2');
    await clearNumberFilters(page);
    await page.getByRole('switch', { name: 'Profile Image' }).click();
    await expect(
      page.getByRole('switch', { name: 'Profile Image' })
    ).not.toBeChecked();
    await page.getByRole('button', { name: 'Pick Winners' }).click();

    const dialog = page.getByRole('dialog', { name: 'Winners', exact: true });
    const links = dialog.getByRole('link', { name: FIXTURE_RETWEETER });
    const firstWinners = await expectRetweeters(links, 2);
    const firstId = await drawIdOf(dialog.page());

    await dialog.getByRole('button', { name: 'Share' }).click();
    const [intent] = await openedWindows(page);
    const intentUrl = new URL(intent);
    expect(intentUrl.searchParams.get('in_reply_to')).toBe(
      E2E_X_FIXTURES.tweet
    );
    expect(intentUrl.searchParams.get('text')).toContain(
      `/pickers/x/${firstId}`
    );

    await dialog.getByRole('button', { name: 'Re-roll Winners' }).click();
    await expect(
      dialog.getByRole('link', { name: `Verify the Draw: ${firstId}` })
    ).toHaveCount(0, { timeout: 30_000 });
    const winners = await expectRetweeters(links, 2);
    const secondId = await drawIdOf(page);
    expect(secondId).not.toBe(firstId);

    await dialog.getByRole('link', { name: 'View Details →' }).click();
    await page.waitForURL(`**/pickers/x/${secondId}`);
    await page.reload();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Draw Verification' })
    ).toBeVisible();
    await expect(page.getByText('Verified', { exact: true })).toBeVisible();
    await expect(statValue(page, 'Winners')).toHaveText(/^\s*2\s*Winners$/);
    await expect(statValue(page, 'Participants')).toHaveText(
      new RegExp(`^\\s*${E2E_X_FIXTURES.retweeters}\\s*Participants$`)
    );
    await expect(page.getByRole('link', { name: postUrl })).toHaveAttribute(
      'href',
      postUrl
    );
    for (const winner of winners) {
      await expect(
        page.getByText(winner, { exact: true }).first()
      ).toBeVisible();
    }

    const image = await page.request.get(`/api/og/pickers/x/${secondId}`);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toBe('image/png');

    await page.goto(`/pickers/x/${firstId}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Draw Verification' })
    ).toBeVisible();
    for (const winner of firstWinners) {
      await expect(
        page.getByText(winner, { exact: true }).first()
      ).toBeVisible();
    }
  });

  test.describe(() => {
    test.use({
      allowedPageErrors: [/Failed to load resource: .* status of 500/]
    });

    test('a visitor recovers from a post that fails to load', async ({
      page
    }) => {
      await page.goto('/pickers/x');

      for (const url of [
        fixturePostUrl(E2E_X_FIXTURES.tweetNotFound),
        'https://t.co/abc123'
      ]) {
        const response = page.waitForResponse(LOAD_TWEET_PATH);
        await loadFixtureTweet(page, url);
        expect((await response).status()).toBe(500);

        await expect(
          page.getByText('An unexpected error occurred').first()
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Load Tweet' })
        ).toBeEnabled();
        await expect(
          page.getByRole('button', { name: 'Pick Winners' })
        ).toHaveCount(0);
      }
      await expect(page.getByText('Application error')).toHaveCount(0);

      await loadFixtureTweet(page, fixturePostUrl(E2E_X_FIXTURES.tweet));
      await expect(
        page.getByText(`The e2e fixture tweet ${E2E_X_FIXTURES.tweet}`)
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Pick Winners' })
      ).toBeVisible();
    });
  });
});
