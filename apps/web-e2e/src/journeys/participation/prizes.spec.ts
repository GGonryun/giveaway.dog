import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BONUS = 'Claim a free entry';

const pickPrize = async (page: Page, name: string) => {
  await page.getByRole('tab', { name: 'Prizes' }).click();
  await page.getByRole('heading', { name }).click();
  await page.getByRole('button', { name: 'Select This Prize' }).click();
  await expect(page.getByText(`You are competing for ${name}`)).toBeVisible();
};

test.describe('prize selection', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a participant picks a prize before the tasks unlock, and can switch it', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    const { ns } = await freshPersona('participant');
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
      ]
    });
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      criteria: { allowUserSelection: true },
      audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
      tasks: [{ type: 'BONUS_TASK', title: BONUS }],
      prizes: [{ name: 'Golden ticket' }, { name: 'Silver ticket' }]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByRole('tab', { name: 'Prizes' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(
      page.getByText('What prize are you competing for?')
    ).toBeVisible();
    await page.getByRole('tab', { name: 'Tasks' }).click();
    await expect(
      page.getByRole('button', { name: 'Select Prize' })
    ).toBeVisible();

    await pickPrize(page, 'Golden ticket');
    await page.getByRole('tab', { name: 'Tasks' }).click();
    await expect(
      page.getByRole('button', { name: 'Select Prize' })
    ).toBeHidden();
    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();

    await page.reload();
    await page.getByRole('tab', { name: 'Prizes' }).click();
    await expect(
      page.getByText('You are competing for Golden ticket')
    ).toBeVisible();

    await pickPrize(page, 'Silver ticket');
    await page.reload();
    await page.getByRole('tab', { name: 'Prizes' }).click();
    await expect(
      page.getByText('You are competing for Silver ticket')
    ).toBeVisible();
  });
});
