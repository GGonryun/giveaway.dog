import type { APIResponse } from '@playwright/test';
import { E2E_X_FIXTURES } from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import {
  FREE_PICKER_DAILY_CREDITS,
  fixturePostUrl,
  loadFixtureTweet,
  postLoadTweet,
  postPickWinners,
  skipWithoutScrapeBadgerFixtures,
  useCreditPool
} from '../../helpers/pickers';

const DAY_SECONDS = 24 * 60 * 60;

const expectOutOfCredits = async (response: APIResponse) => {
  expect(response.status()).toBe(429);
  const retryAfter = response.headers()['retry-after'];
  expect(retryAfter).toMatch(/^\d+$/);
  expect(Number(retryAfter)).toBeGreaterThanOrEqual(1);
  expect(Number(retryAfter)).toBeLessThanOrEqual(DAY_SECONDS);

  const body = await response.json();
  expect(body).toMatchObject({
    success: false,
    creditsNeeded: 1,
    creditsRemaining: 0
  });
  expect(Number.isNaN(Date.parse(body.retryAfterISO))).toBe(false);
};

test.describe('free X picker credits', () => {
  skipWithoutScrapeBadgerFixtures();

  test.use({
    allowedPageErrors: [/Failed to load resource: .* status of 429/]
  });

  test('an anonymous client cannot use more than the daily credits', async ({
    page,
    context
  }, testInfo) => {
    await useCreditPool(context, testInfo);
    const postUrl = fixturePostUrl(E2E_X_FIXTURES.tweet);

    let loaded = 0;
    let response = await postLoadTweet(page.request, postUrl);
    while (response.ok() && loaded <= FREE_PICKER_DAILY_CREDITS) {
      loaded += 1;
      response = await postLoadTweet(page.request, postUrl);
    }
    expect(loaded, 'The tweets loaded before the limit').toBe(
      FREE_PICKER_DAILY_CREDITS
    );
    await expectOutOfCredits(response);
    await expectOutOfCredits(await postPickWinners(page.request, postUrl));

    await page.goto('/pickers/x');
    await loadFixtureTweet(page, postUrl);
    const dialog = page.getByRole('dialog', { name: 'Rate Limit Reached' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/^(\d+h \d{2}m |\d+m )?\d{1,2}s$/)
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Go Back' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: 'Load Tweet' }).click();
    await expect(
      dialog.getByRole('link', { name: 'Upgrade to PRO' })
    ).toHaveAttribute('href', '/pricing');
  });
});
