import { E2E_X_FIXTURES } from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import {
  LOAD_TWEET_PATH,
  loadFixtureTweet,
  postLoadTweet,
  postPickWinners,
  skipWithoutScrapeBadgerFixtures,
  useCreditPool
} from '../../helpers/pickers';

const tweet = E2E_X_FIXTURES.tweet;

test.describe('free X picker post URLs on the ScrapeBadger fixtures', () => {
  skipWithoutScrapeBadgerFixtures();

  test.beforeEach(async ({ context }, testInfo) => {
    await useCreditPool(context, testInfo);
  });

  test.describe(() => {
    test.use({
      allowedPageErrors: [/Failed to load resource: .* status of 400/]
    });

    test('a visitor sees why a post URL is refused', async ({ page }) => {
      const sent: string[] = [];
      page.on('request', (request) => {
        if (request.url().endsWith(LOAD_TWEET_PATH)) sent.push(request.url());
      });
      await page.goto('/pickers/x');

      for (const [url, message] of [
        ['hello', 'Please enter a valid URL'],
        [
          'https://example.com/a/status/1',
          'Please enter a valid X (Twitter) post URL'
        ]
      ]) {
        await loadFixtureTweet(page, url);
        await expect(page.getByText(message, { exact: true })).toBeVisible();
      }
      expect(sent, 'The form sends no refused URL').toEqual([]);

      const refused = page.waitForResponse(`**${LOAD_TWEET_PATH}`);
      await loadFixtureTweet(page, 'https://x.com/someone');
      expect((await refused).status()).toBe(400);
      await expect(
        page.getByText('Could not extract tweet ID from URL')
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Load Tweet' })
      ).toBeEnabled();
    });
  });

  test('a visitor loads a post from each form of its URL', async ({ page }) => {
    for (const url of [
      `https://twitter.com/u/status/${tweet}`,
      `https://mobile.twitter.com/u/status/${tweet}`,
      `https://x.com/u/status/${tweet}?s=20`,
      `https://x.com/i/status/${tweet}`
    ]) {
      const response = await postLoadTweet(page.request, url);
      expect(response.status(), url).toBe(200);
      expect((await response.json()).data.id, url).toBe(tweet);
    }
  });

  test('a visitor loads a post from its x.com/i/web URL', async ({ page }) => {
    const response = await postLoadTweet(
      page.request,
      `https://x.com/i/web/status/${tweet}`
    );
    expect(response.status()).toBe(200);
    expect((await response.json()).data.id).toBe(tweet);
  });

  test('an anonymous caller cannot put a link to another site on a verified draw', async ({
    page
  }) => {
    const postUrl = `https://evil.example/?u=x.com/a/status/${tweet}`;
    expect((await postLoadTweet(page.request, postUrl)).status()).toBe(400);
    expect((await postPickWinners(page.request, postUrl)).status()).toBe(400);
  });
});
