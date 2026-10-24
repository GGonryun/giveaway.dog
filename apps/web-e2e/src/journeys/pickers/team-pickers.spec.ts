import type { APIRequestContext, Page } from '@playwright/test';
import { E2E_X_FIXTURES } from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { signInAs } from '../../helpers/personas';
import {
  FIXTURE_RETWEETER,
  skipWithoutScrapeBadgerFixtures,
  statValue
} from '../../helpers/pickers';
import { seedApi } from '../../helpers/seed';

const seedProTeam = (request: APIRequestContext, ns: string) =>
  seedApi(request).team({
    ns,
    suffix: 'xp',
    name: `Pickers ${ns}`,
    tier: 'PRO'
  });

const eligibleUser = (username: string) => ({
  username,
  name: `Name ${username}`,
  followersCount: 500
});

const winnersCard = (page: Page) =>
  page
    .getByText(/^Winners \(\d+\)$/)
    .locator('xpath=ancestor::*[@data-slot="card"][1]');

const winnerHandles = async (page: Page) =>
  (
    await winnersCard(page)
      .getByText(/^@\w+$/)
      .allTextContents()
  ).map((handle) => handle.slice(1));

test.describe('team X pickers', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to seed pickers');

  test.use({
    allowedPageErrors: [/ClientFetchError|Unable to load tweet preview/]
  });

  test('a host draws, re-rolls and draws an extra winner, and the public page matches', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedProTeam(request, ns);
    const eligible = [`ok1_${ns}`, `ok2_${ns}`, `ok3_${ns}`];
    const picker = await seedApi(request).picker({
      team: team.slug,
      winners: 1,
      minFollowersCount: 100,
      users: [
        ...eligible.map(eligibleUser),
        { username: `low_${ns}`, followersCount: 5 }
      ],
      posts: [{ text: 'An e2e post', retweetCount: 4 }]
    });
    await signInAs(page.request, 'host', ns);

    await page.goto(`/app/${team.slug}/pickers/x/${picker.id}`);
    await expect(page.getByText('Ready to Draw Winners')).toBeVisible();
    await expect(
      page.getByText('1 winner will be selected from 3 eligible participants.')
    ).toBeVisible();
    for (const [label, value] of [
      ['Total Actions', 4],
      ['Participants', 4],
      ['Eligible', 3],
      ['Filtered Out', 1]
    ] as const) {
      await expect(statValue(page, label)).toHaveText(`${value}${label}`);
    }

    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Draw Winners' }).click();
    await expect(page.getByText('Winners (1)')).toBeVisible({
      timeout: 15_000
    });
    const [first] = await winnerHandles(page);
    expect(eligible).toContain(first);

    const reason = `Did not follow the rules ${ns}`;
    await page.getByRole('button', { name: 'Re-roll winner' }).click();
    const disqualify = page.getByRole('dialog', { name: 'Disqualify Winner' });
    await disqualify
      .getByRole('textbox', { name: 'Reason for disqualification' })
      .fill(reason);
    await disqualify
      .getByRole('button', { name: 'Disqualify & Re-roll' })
      .click();
    await expect(disqualify).toBeHidden();
    await expect
      .poll(async () => (await winnerHandles(page)).join(), {
        timeout: 15_000
      })
      .not.toBe(first);
    const [second] = await winnerHandles(page);
    expect(eligible).toContain(second);
    expect(second).not.toBe(first);

    await page.getByText('Draw History', { exact: true }).click();
    await page.getByRole('button', { name: 'View Reason' }).click();
    const reasonDialog = page.getByRole('dialog');
    await expect(reasonDialog.getByText(reason)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(reasonDialog).toBeHidden();

    await page.getByRole('button', { name: 'Draw Extra' }).click();
    await page.getByRole('button', { name: 'Confirm Draw' }).click();
    await expect(page.getByText('Winners (2)')).toBeVisible({
      timeout: 15_000
    });
    const winners = await winnerHandles(page);
    expect(winners).toHaveLength(2);
    expect(winners).not.toContain(first);

    await page.reload();
    await expect(page.getByText('Winners (2)')).toBeVisible();
    expect((await winnerHandles(page)).sort()).toEqual([...winners].sort());

    await page.goto(`/pickers/x/${picker.id}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Draw Verification' })
    ).toBeVisible();
    await expect(statValue(page, 'Winners')).toHaveText(/^\s*2\s*Winners$/);
    for (const winner of winners) {
      await expect(page.getByText(`@${winner}`).first()).toBeVisible();
    }
    await page.getByRole('switch', { name: 'Show Rerolled Users' }).click();
    await page.getByRole('button', { name: 'View Reason' }).click();
    await expect(page.getByRole('dialog').getByText(reason)).toBeVisible();
  });

  test(
    'a host who draws again with no eligible user left sees why nothing was drawn',
    knownBug(480),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedProTeam(request, ns);
      const picker = await seedApi(request).picker({
        team: team.slug,
        users: [{ username: `only_${ns}` }],
        draws: [{ user: 0 }]
      });
      await signInAs(page.request, 'host', ns);

      await page.goto(`/app/${team.slug}/pickers/x/${picker.id}`);
      await expect(page.getByText('Winners (1)')).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: 'Draw Extra' }).click();
      await page.getByRole('button', { name: 'Confirm Draw' }).click();

      await expect(
        page.getByText('All eligible users have already been drawn as winners')
      ).toBeVisible();
    }
  );

  test.describe('on the ScrapeBadger fixtures', () => {
    skipWithoutScrapeBadgerFixtures();

    test('a host creates, publishes and processes a picker until winners can be drawn', async ({
      page,
      request
    }, testInfo) => {
      test.slow();
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedProTeam(request, ns);
      await signInAs(page.request, 'host', ns);

      await page.goto(`/app/${team.slug}/pickers/x`);
      await page.getByRole('button', { name: 'Create', exact: true }).click();
      await page.waitForURL(/\/pickers\/x\/[^/]+\/create$/);
      const pickerId = page.url().split('/').at(-2)!;

      await page
        .getByRole('textbox', { name: 'Post URL' })
        .fill(`https://x.com/e2e_fixture/status/${E2E_X_FIXTURES.tweet}`);
      await page
        .getByRole('spinbutton', { name: 'Number of Winners' })
        .fill('1');
      for (const name of [
        'Minimum Post Count',
        'Account Age (Days)',
        'Minimum Followers',
        'Minimum Following'
      ]) {
        await page.getByRole('spinbutton', { name }).clear();
      }
      const profileImage = page.getByRole('switch', { name: 'Profile Image' });
      if (await profileImage.isChecked()) await profileImage.click();

      await page
        .locator('header')
        .getByRole('button', { name: 'Publish', exact: true })
        .click();
      await page
        .getByRole('dialog', { name: 'Ready to Publish?' })
        .getByRole('button', { name: 'Publish', exact: true })
        .click();
      await expect(
        page.getByText('Picker published successfully!')
      ).toBeVisible();

      await page.goto(`/app/${team.slug}/pickers/x/${pickerId}`);
      await expect(async () => {
        await page.reload();
        await expect(page.getByText('Ready to Draw Winners')).toBeVisible({
          timeout: 2_000
        });
      }).toPass({ timeout: 60_000, intervals: [2_000] });

      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: 'Draw Winners' }).click();
      await expect(page.getByText('Winners (1)')).toBeVisible({
        timeout: 15_000
      });
      const [winner] = await winnerHandles(page);
      expect(`@${winner}`).toMatch(FIXTURE_RETWEETER);

      await page.goto(`/app/${team.slug}/pickers/x?status=COMPLETE`);
      await expect(
        page.getByRole('row', { name: new RegExp(`^${pickerId} .* Complete$`) })
      ).toBeVisible();

      await page.goto(`/pickers/x/${pickerId}`);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Draw Verification' })
      ).toBeVisible();
      await expect(page.getByText(`@${winner}`).first()).toBeVisible();
    });
  });
});
