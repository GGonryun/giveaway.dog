import { E2E_X_FIXTURES } from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import {
  FIXTURE_RETWEETER,
  clearNumberFilters,
  expectRetweeters,
  fixturePostUrl,
  loadFixtureTweet,
  postPickWinners,
  seedPickerTeam,
  skipWithoutScrapeBadgerFixtures,
  statValue,
  useCreditPool
} from '../../helpers/pickers';
import { seedApi } from '../../helpers/seed';

const HIDDEN_STATUSES = [
  'DRAFT',
  'PROCESSED',
  'FAILED',
  'CANCELLED',
  'SUSPENDED'
] as const;

const PUBLISHED_STATUSES = [
  { status: 'CREATED', heading: 'Upcoming Draw', badge: 'Pending' },
  { status: 'SCHEDULED', heading: 'Upcoming Draw', badge: 'Pending' },
  { status: 'PROCESSING', heading: 'Upcoming Draw', badge: 'Processing' },
  { status: 'COMPLETE', heading: 'Draw Verification', badge: 'Verified' }
] as const;

const FIRST_PAGE = 10;

test.describe('X picker draw pages', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to seed pickers');

  test.use({ allowedPageErrors: [/didn't match the client properties/] });

  test('a visitor opens only the draws that were published', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);

    for (const status of HIDDEN_STATUSES) {
      const picker = await seedApi(request).picker({ team: team.slug, status });
      const response = await request.get(`/pickers/x/${picker.id}`);
      expect(response.status(), status).toBe(404);
      expect(await response.text()).toContain('Content not found');
    }

    for (const { status, heading, badge } of PUBLISHED_STATUSES) {
      const picker = await seedApi(request).picker({
        team: team.slug,
        status,
        users: [{ username: `win_${ns}` }],
        draws: status === 'COMPLETE' ? [{ user: 0 }] : []
      });
      const response = await page.goto(`/pickers/x/${picker.id}`);
      expect(response?.status(), status).toBe(200);
      await expect(
        page.getByRole('heading', { level: 1, name: heading })
      ).toBeVisible();
      await expect(
        page.getByText(badge, { exact: true }).first()
      ).toBeVisible();

      const image = await request.get(`/api/og/pickers/x/${picker.id}`);
      expect(image.status(), status).toBe(200);
      expect(image.headers()['content-type']).toBe('image/png');
    }

    const unknown = await request.get('/api/og/pickers/x/e2e-unknown-picker');
    expect(unknown.status()).toBe(200);
    expect(unknown.headers()['content-type']).toBe('image/png');
  });

  test('a visitor sees who could win under the filters of a draw', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);
    const passes = {
      followersCount: 500,
      followingCount: 500,
      tweetCount: 500,
      createdDaysAgo: 400,
      profileImageUrl: 'https://pbs.twimg.com/profile_images/e2e/a.jpg',
      bannerImageUrl: 'https://pbs.twimg.com/profile_banners/e2e/a.jpg',
      location: 'Somewhere',
      description: 'A bio'
    };
    const users = [
      { ...passes, username: `a_${ns}` },
      { ...passes, username: `b_${ns}`, followersCount: 5 },
      { ...passes, username: `c_${ns}`, createdDaysAgo: 10 },
      { ...passes, username: `d_${ns}`, profileImageUrl: undefined },
      {
        ...passes,
        username: `e_${ns}`,
        description: undefined,
        location: undefined,
        bannerImageUrl: undefined
      }
    ];
    const picker = await seedApi(request).picker({
      team: team.slug,
      minPostCount: 100,
      minAccountAgeDays: 90,
      minFollowersCount: 100,
      minFollowingCount: 100,
      requireProfileImage: true,
      requireBio: true,
      users,
      draws: [{ user: 0 }]
    });

    await page.goto(`/pickers/x/${picker.id}`);
    await expect(statValue(page, 'Participants')).toHaveText(
      /^\s*5\s*Participants$/
    );
    for (const badge of [
      'Min 100 posts',
      'Min 100 followers',
      'Min 100 following',
      'Account 90+ days old'
    ]) {
      await expect(page.getByText(badge, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Profile Requirements')).toBeVisible();
    await expect(page.getByText('Bio', { exact: true })).toBeVisible();
    await expect(page.getByText('Banner Image', { exact: true })).toHaveCount(
      0
    );

    await expect(statValue(page, 'Eligible')).toHaveText(/^\s*1\s*Eligible$/);
    await expect(
      page.getByRole('row', { name: `@${users[0].username} Winner` })
    ).toBeVisible();

    await page.getByRole('switch', { name: 'Show Filtered Users' }).click();
    await expect(
      page.getByRole('row', { name: `@${users[0].username} Eligible` })
    ).toBeVisible();
    for (const { username } of users.slice(1)) {
      await expect(
        page.getByRole('row', { name: `@${username} Filtered` })
      ).toBeVisible();
    }
  });
});

test.describe('the free X picker for a user who has not finished onboarding', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ storageState: personaState('newbie') });

  test(
    'opens the free picker and a shared draw',
    knownBug(584),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedPickerTeam(request, ns);
      const picker = await seedApi(request).picker({ team: team.slug });

      await page.goto('/pickers/x');
      expect(new URL(page.url()).pathname).toBe('/pickers/x');
      await expect(
        page.getByRole('heading', { level: 1, name: 'X (Twitter) Picker' })
      ).toBeVisible();

      await page.goto(`/pickers/x/${picker.id}`);
      expect(new URL(page.url()).pathname).toBe(`/pickers/x/${picker.id}`);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Draw Verification' })
      ).toBeVisible();
    }
  );
});

test.describe('free X picker filters on the ScrapeBadger fixtures', () => {
  skipWithoutScrapeBadgerFixtures();

  test.beforeEach(async ({ context }, testInfo) => {
    await useCreditPool(context, testInfo);
  });

  test.use({
    allowedPageErrors: [/Failed to load resource: .* status of 400/]
  });

  test(
    'a visitor cannot read more than the first page of the participants of a free draw',
    knownBug(585),
    async ({ page }) => {
      const response = await postPickWinners(
        page.request,
        fixturePostUrl(E2E_X_FIXTURES.tweet)
      );
      expect(response.status()).toBe(200);
      const { data } = await response.json();
      const html = await (
        await page.request.get(`/pickers/x/${data.drawId}`)
      ).text();

      const retweeters = new Set(html.match(/e2e_fixture_rt\d+/g));
      expect(retweeters.size).toBeLessThanOrEqual(FIRST_PAGE + 1);
      expect(html).not.toContain('runId');
    }
  );

  test('a visitor learns that too few retweeters pass the filters, and the draw page lists the filters', async ({
    page
  }) => {
    const withAvatar = Math.ceil((E2E_X_FIXTURES.retweeters * 2) / 3);
    await page.goto('/pickers/x');
    await loadFixtureTweet(page, fixturePostUrl(E2E_X_FIXTURES.tweet));
    await clearNumberFilters(page);
    await page
      .getByRole('spinbutton', { name: 'Number of Winners' })
      .fill(String(withAvatar + 1));
    await expect(
      page.getByRole('switch', { name: 'Profile Image' })
    ).toBeChecked();

    const refused = page.waitForResponse(
      '**/api/pickers/x/public/pick-winners'
    );
    await page.getByRole('button', { name: 'Pick Winners' }).click();
    const response = await refused;
    expect(response.status()).toBe(400);
    expect(JSON.stringify(await response.json())).toContain(
      `Only ${withAvatar} of ${E2E_X_FIXTURES.retweeters} users passed your filters`
    );
    const error = page.getByRole('dialog', {
      name: 'Not Enough Eligible Entries'
    });
    await expect(error).toBeVisible();
    await error.getByRole('button', { name: 'Adjust Filters' }).click();
    await expect(error).toBeHidden();

    await page.getByRole('spinbutton', { name: 'Number of Winners' }).fill('1');
    await page.getByRole('spinbutton', { name: 'Minimum Followers' }).fill('5');
    await page.getByRole('switch', { name: 'Bio/Description' }).click();
    await page.getByRole('button', { name: 'Pick Winners' }).click();
    const dialog = page.getByRole('dialog', { name: 'Winners', exact: true });
    await expectRetweeters(
      dialog.getByRole('link', { name: FIXTURE_RETWEETER }),
      1
    );
    await dialog.getByRole('link', { name: 'View Details →' }).click();
    await page.waitForURL(/\/pickers\/x\/[^/]+$/);

    await expect(
      page.getByText('Min 5 followers', { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Profile Image', { exact: true })
    ).toBeVisible();
    await expect(page.getByText('Bio', { exact: true })).toBeVisible();
    await expect(page.getByText(/^Min \d+ posts$/)).toHaveCount(0);
    await expect(page.getByText(/^Account \d+\+ days old$/)).toHaveCount(0);
  });
});
