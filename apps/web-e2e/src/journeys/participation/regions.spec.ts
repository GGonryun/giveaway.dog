import type { APIRequestContext, Page, TestInfo } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BONUS = 'Claim a free entry';
const NOT_ELIGIBLE = 'You are not eligible to participate in this giveaway.';

const US = {
  country: 'United States',
  countryCode: 'US',
  continent: 'North America',
  continentCode: 'NA'
};

const seedRegionGiveaway = async (
  request: APIRequestContext,
  testInfo: TestInfo,
  filter: 'INCLUDE' | 'EXCLUDE'
) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  return seedApi(request).sweepstakes({
    ns: RUN_ID,
    team: team.slug,
    audience: {
      allowedIdentities: ['GOOGLE'],
      formFields: [],
      regionalRestriction: { regions: ['country:US'], filter }
    },
    tasks: [{ type: 'BONUS_TASK', title: BONUS }]
  });
};

const signInFrom = async (
  request: APIRequestContext,
  freshPersona: (persona: 'participant') => Promise<{ ns: string }>,
  location?: typeof US
) => {
  const { ns } = await freshPersona('participant');
  await seedApi(request).userExtras({
    ns: RUN_ID,
    users: [
      {
        persona: 'participant',
        ns,
        accounts: [{ identity: 'GOOGLE' }],
        ...(location && { location })
      }
    ]
  });
};

const expectNotEligible = async (page: Page, requirement: string) => {
  await expect(page.getByText(NOT_ELIGIBLE)).toBeVisible();
  await expect(page.getByText(requirement)).toBeVisible();
  await expect(page.getByRole('heading', { name: BONUS })).toBeHidden();
};

test.describe('regional restrictions', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('[ENTRY-005] a participant whose country is unknown cannot enter a giveaway for the US only', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    await signInFrom(request, freshPersona);
    const giveaway = await seedRegionGiveaway(request, testInfo, 'INCLUDE');

    await page.goto(`/browse/${giveaway.id}`);

    await expectNotEligible(page, 'Only available in: United States');
  });

  test('[ENTRY-005] a participant whose country is unknown cannot enter a giveaway that excludes the US', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    await signInFrom(request, freshPersona);
    const giveaway = await seedRegionGiveaway(request, testInfo, 'EXCLUDE');

    await page.goto(`/browse/${giveaway.id}`);

    await expectNotEligible(page, 'Not available in: United States');
  });

  test('a participant in the US cannot enter a giveaway that excludes the US', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    await signInFrom(request, freshPersona, US);
    const giveaway = await seedRegionGiveaway(request, testInfo, 'EXCLUDE');

    await page.goto(`/browse/${giveaway.id}`);

    await expectNotEligible(page, 'Not available in: United States');
  });

  test('a participant in the US enters a giveaway for the US only', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    await signInFrom(request, freshPersona, US);
    const giveaway = await seedRegionGiveaway(request, testInfo, 'INCLUDE');

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText(NOT_ELIGIBLE)).toBeHidden();
    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Your entries: 1')).toBeVisible();
  });

  test(
    'the terms name the countries of the restriction',
    knownBug(29),
    async ({ page, request }, testInfo) => {
      const giveaway = await seedRegionGiveaway(request, testInfo, 'INCLUDE');

      await page.goto(`/browse/${giveaway.id}`);
      await page.getByRole('button', { name: 'Terms & Conditions' }).click();

      const terms = page.getByRole('dialog', { name: 'Terms & Conditions' });
      await expect(terms).toContainText('United States');
      await expect(terms).not.toContainText('country:US');
    }
  );
});
