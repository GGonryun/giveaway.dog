import type {
  APIRequestContext,
  BrowserContext,
  Locator,
  Page,
  TestInfo
} from '@playwright/test';
import {
  E2E_CREDITS_POOL_COOKIE,
  E2E_CREDITS_SECRET_COOKIE
} from '@giveaway/e2e-model/credits';
import {
  E2E_X_FIXTURES,
  toE2eXFixtureRetweeterUsername
} from '@giveaway/e2e-model/fakes';
import { expect, test } from '../fixtures/test';
import { BASE_URL, E2E_SECRET, RUN_ID } from '../env';
import { fakesOf } from './outbox';
import { seedApi } from './seed';

export const FREE_PICKER_DAILY_CREDITS = 20;

export const LOAD_TWEET_PATH = '/api/pickers/x/public/load-tweet';

export const PICK_WINNERS_PATH = '/api/pickers/x/public/pick-winners';

export const fixturePostUrl = (id: string) =>
  `https://x.com/${E2E_X_FIXTURES.author}/status/${id}`;

export const FIXTURE_RETWEETER = new RegExp(
  `^@${toE2eXFixtureRetweeterUsername(0).replace(/0$/, '(\\d+)')}$`
);

export const skipWithoutScrapeBadgerFixtures = () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to read the fakes');

  test.beforeEach(async ({ request }) => {
    const fakes = fakesOf(await seedApi(request).health());
    test.skip(
      !fakes.includes('scrapebadger'),
      'Set E2E_FAKE_EXTERNALS to scrapebadger'
    );
  });
};

export const creditPoolOf = (testInfo: TestInfo) =>
  `${RUN_ID}-${testInfo.testId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24)}-${testInfo.retry}`;

export const useCreditPool = async (
  context: BrowserContext,
  testInfo: TestInfo
) => {
  const cookie = {
    url: BASE_URL,
    httpOnly: true,
    sameSite: 'Lax' as const
  };
  await context.addCookies([
    { ...cookie, name: E2E_CREDITS_SECRET_COOKIE, value: E2E_SECRET },
    { ...cookie, name: E2E_CREDITS_POOL_COOKIE, value: creditPoolOf(testInfo) }
  ]);
};

export const loadFixtureTweet = async (page: Page, url: string) => {
  await page.getByRole('textbox', { name: 'Post URL' }).fill(url);
  await page.getByRole('button', { name: 'Load Tweet' }).click();
};

export const clearNumberFilters = async (page: Page) => {
  for (const name of [
    'Minimum Post Count',
    'Account Age (Days)',
    'Minimum Followers',
    'Minimum Following'
  ]) {
    await page.getByRole('spinbutton', { name }).clear();
  }
};

export const statValue = (scope: Page | Locator, label: string) =>
  scope.getByText(label, { exact: true }).first().locator('xpath=..');

export const postLoadTweet = (request: APIRequestContext, postUrl: string) =>
  request.post(LOAD_TWEET_PATH, { data: { postUrl } });

export const postPickWinners = (request: APIRequestContext, postUrl: string) =>
  request.post(PICK_WINNERS_PATH, {
    data: {
      postUrl,
      winnersCount: 1,
      filters: {
        minimumPostCount: null,
        minimumAccountAgeDays: null,
        minimumFollowers: null,
        minimumFollowing: null,
        lastPostWithin: null,
        hasProfileImage: false,
        hasBanner: false,
        hasLocation: false,
        hasDescription: false
      }
    }
  });

export const expectRetweeters = async (links: Locator, count: number) => {
  await expect(links).toHaveCount(count, { timeout: 30_000 });
  const handles = await links.allTextContents();
  expect(new Set(handles).size, 'The winners are distinct').toBe(count);
  return handles;
};
