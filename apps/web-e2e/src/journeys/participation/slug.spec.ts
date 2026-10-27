import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { freshSlug, seedApi, seedWorkerTeam } from '../../helpers/seed';

const BONUS = 'Claim a free entry';
const REFER = 'Refer a Friend';
const GOLDEN = 'Golden ticket';

const openReferral = async (page: Page, path: string) => {
  await page.goto(path);
  await page.getByRole('heading', { name: REFER }).click();
};

const openPrize = async (page: Page, path: string) => {
  await page.goto(path);
  await page.getByRole('tab', { name: 'Prizes' }).click();
  await page.getByRole('heading', { name: GOLDEN }).click();
};

test.describe('a giveaway opened by its slug', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  let ns = '';

  test.beforeEach(async ({ request, freshPersona }) => {
    ({ ns } = await freshPersona('participant'));
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
      ]
    });
  });

  test(
    'a participant sees their referral link on the slug URL too',
    knownBug(599),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const slug = freshSlug(testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug,
        slug,
        audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
        tasks: [
          { type: 'BONUS_TASK', title: BONUS },
          { type: 'REFERRAL_LINK', title: REFER, maximum: 2 }
        ],
        entries: [{ persona: 'participant', ns, completions: [{ task: 0 }] }],
        referrals: [{ entry: 0, task: 1 }]
      });
      const [{ code }] = giveaway.referrals;
      const link = page.getByRole('textbox');

      await openReferral(page, `/browse/${giveaway.id}`);
      await expect(link).toHaveValue(new RegExp(`[?&]ref=${code}$`));

      await openReferral(page, `/browse/${slug}`);
      await expect(
        page.getByRole('button', { name: 'Generate Referral Code' })
      ).toBeHidden();
      await expect(link).toHaveValue(new RegExp(`[?&]ref=${code}$`));
    }
  );

  test(
    'a participant sees the popularity of the prizes on the slug URL too',
    knownBug(599),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const slug = freshSlug(testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug,
        slug,
        criteria: { allowUserSelection: true },
        audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
        tasks: [{ type: 'BONUS_TASK', title: BONUS }],
        prizes: [{ name: GOLDEN }, { name: 'Silver ticket' }],
        entries: [
          { persona: 'participant', ns, prize: 1 },
          { persona: 'participant2', ns, prize: 0 },
          { persona: 'newbie', ns, prize: 0 }
        ]
      });
      const popularity = page.getByText('(2/3) 67%');

      await openPrize(page, `/browse/${giveaway.id}`);
      await expect(page.getByText('Most Popular')).toBeVisible();
      await expect(popularity).toBeVisible();

      await openPrize(page, `/browse/${slug}`);
      await expect(page.getByText('Most Popular')).toBeVisible();
      await expect(popularity).toBeVisible();
    }
  );
});
