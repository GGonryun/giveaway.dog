import type { Browser, Page } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import type { E2eTaskRequest } from '@giveaway/e2e-model/requests';
import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE, E2E_SECRET, RUN_ID } from '../../env';
import { freshNamespace } from '../../fixtures/personas';
import { knownBug } from '../../helpers/known-bug';
import { signInAs } from '../../helpers/personas';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { blockThirdParties } from '../../helpers/third-party';

const BONUS = 'Claim a free entry';
const REFER = 'Refer a Friend';

const withGoogle = (persona: E2ePersona, ns: string) => ({
  persona,
  ns,
  accounts: [{ identity: 'GOOGLE' as const }]
});

const claimBonus = async (page: Page) => {
  await page.getByRole('heading', { name: BONUS }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Task completed!')).toBeVisible();
};

const newFriendPage = async (browser: Browser) => {
  const context = await browser.newContext({ storageState: BYPASS_STATE });
  await blockThirdParties(context);
  return context.newPage();
};

const referralCode = async (page: Page) => {
  await page.getByRole('heading', { name: REFER }).click();
  await page.getByRole('button', { name: 'Generate Referral Code' }).click();
  const link = new URL(await page.getByRole('textbox').inputValue());
  const code = link.searchParams.get('ref');
  expect(code, `The referral link ${link} has no ref`).toBeTruthy();
  return code!;
};

type Setup = {
  page: Page;
  browser: Browser;
  request: Parameters<typeof seedApi>[0];
  ns: string;
  friendNs: string;
  team: string;
  tasks?: Partial<E2eTaskRequest>[];
  entriesBefore?: number;
};

const seedReferralGiveaway = async ({
  request,
  ns,
  friendNs,
  team,
  tasks = []
}: Omit<Setup, 'page' | 'browser' | 'entriesBefore'>) => {
  await seedApi(request).userExtras({
    ns: RUN_ID,
    users: [withGoogle('participant', ns), withGoogle('participant2', friendNs)]
  });
  return seedApi(request).sweepstakes({
    ns: RUN_ID,
    team,
    audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
    tasks: [
      { type: 'REFERRAL_LINK', title: REFER, value: 3, maximum: 2 },
      { type: 'BONUS_TASK', title: BONUS },
      ...(tasks as E2eTaskRequest[])
    ]
  });
};

const referAFriend = async (setup: Setup) => {
  const giveaway = await seedReferralGiveaway(setup);
  const { page, browser, friendNs, entriesBefore = 1 } = setup;
  const entries = `Your entries: ${entriesBefore}`;

  await page.goto(`/browse/${giveaway.id}`);
  await claimBonus(page);
  await page.reload();
  await expect(page.getByText(entries)).toBeVisible();
  const code = await referralCode(page);

  const friend = await newFriendPage(browser);
  await friend.goto(`/browse/${giveaway.id}?ref=${code}`);
  await expect(friend.getByText('Not signed in')).toBeVisible();
  await signInAs(friend.request, 'participant2', friendNs);
  await friend.goto(`/browse/${giveaway.id}`);
  await claimBonus(friend);
  await friend.reload();
  await expect(friend.getByText(entries)).toBeVisible();
  await friend.context().close();

  await page.goto(`/browse/${giveaway.id}`);
  return giveaway;
};

test.describe('referrals', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a participant earns entries when a friend enters through their link', async ({
    page,
    browser,
    request,
    freshPersona
  }, testInfo) => {
    const { ns } = await freshPersona('participant');
    const { team } = await seedWorkerTeam(request, testInfo);

    await referAFriend({
      page,
      browser,
      request,
      ns,
      friendNs: freshNamespace(testInfo.workerIndex),
      team: team.slug
    });

    await expect(page.getByText('Your entries: 4')).toBeVisible();
  });

  test(
    'the referral panel lists the friend who entered',
    knownBug(519),
    async ({ page, browser, request, freshPersona }, testInfo) => {
      const { ns } = await freshPersona('participant');
      const { team } = await seedWorkerTeam(request, testInfo);

      await referAFriend({
        page,
        browser,
        request,
        ns,
        friendNs: freshNamespace(testInfo.workerIndex),
        team: team.slug
      });

      await page.getByRole('heading', { name: REFER }).click();
      const referrals = page.getByRole('button', {
        name: /^1 \/ 2 referrals/
      });
      await expect(referrals).toBeVisible();
      await referrals.click();
      await expect(page.getByText('E2E participant2')).toBeVisible();
    }
  );

  test(
    'a participant earns the referral when the giveaway has the automatic profile bonus',
    knownBug(520),
    async ({ page, browser, request, freshPersona }, testInfo) => {
      const { ns } = await freshPersona('participant');
      const { team } = await seedWorkerTeam(request, testInfo);

      await referAFriend({
        page,
        browser,
        request,
        ns,
        friendNs: freshNamespace(testInfo.workerIndex),
        team: team.slug,
        tasks: [
          { type: 'BONUS_COMPLETE_PROFILE', title: 'Complete your profile' }
        ],
        entriesBefore: 2
      });

      await expect(page.getByText('Your entries: 5')).toBeVisible();
    }
  );
});
