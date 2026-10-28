import type { APIRequestContext, Page, TestInfo } from '@playwright/test';
import type { E2eFormFieldRequest } from '@giveaway/e2e-model/requests';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

type Accounts = { user: { name: string | null; username: string | null } };

const BONUS = 'Claim a free entry';
const AGE = 'I am at least 18 years old';
const X_PROFILE = 'Your X profile';

const seedFormGiveaway = async (
  request: APIRequestContext,
  testInfo: TestInfo
) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  const formFields: E2eFormFieldRequest[] = [
    { type: 'USERNAME', label: 'Your username', required: true },
    { type: 'EMAIL', label: 'Your email' },
    { type: 'AGE', label: AGE, required: true, minimum: 18 },
    { type: 'TWITTER', label: X_PROFILE, required: false, placeholder: '' }
  ];
  return seedApi(request).sweepstakes({
    ns: RUN_ID,
    team: team.slug,
    audience: { allowedIdentities: ['GOOGLE'], formFields },
    tasks: [{ type: 'BONUS_TASK', title: BONUS }]
  });
};

const submitForm = (page: Page) =>
  page.getByRole('button', { name: 'Continue to Sweepstakes' }).click();

const expectTasks = async (page: Page) => {
  await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible({
    timeout: 15_000
  });
  await expect(page.getByRole('heading', { name: BONUS })).toBeVisible();
  await expect(page.getByText('Ready to win?')).toBeHidden();
};

test.describe('the entry form', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  let ns = '';
  let username = '';

  test.beforeEach(async ({ request, freshPersona }) => {
    ({ ns } = await freshPersona('participant'));
    username = `fan_${ns}`;
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        {
          persona: 'participant',
          ns,
          username,
          accounts: [{ identity: 'GOOGLE' }]
        }
      ]
    });
  });

  test('a participant fills in the entry form once, and then enters', async ({
    page,
    request
  }, testInfo) => {
    const giveaway = await seedFormGiveaway(request, testInfo);

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText('Ready to win?')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: AGE })).toBeVisible();
    await expect(page.getByLabel(X_PROFILE)).toBeVisible();
    await expect(page.getByLabel('Your username')).toBeHidden();
    await expect(page.getByLabel('Your email')).toBeHidden();

    await page.getByRole('checkbox', { name: AGE }).check();
    await page.getByLabel(X_PROFILE).fill(`https://x.com/e2e${ns}`);
    await submitForm(page);
    await expectTasks(page);

    await page.reload();
    await expectTasks(page);
    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Your entries: 1')).toBeVisible();
  });

  test('the entry form keeps the username of the participant', async ({
    page,
    request
  }, testInfo) => {
    const giveaway = await seedFormGiveaway(request, testInfo);

    await page.goto(`/browse/${giveaway.id}`);
    await page.getByRole('checkbox', { name: AGE }).check();
    await page.getByLabel(X_PROFILE).fill(`https://x.com/e2e${ns}`);
    await submitForm(page);
    await expectTasks(page);

    const { user } = await seedApi(request).rows<Accounts>({
      view: 'accounts',
      persona: 'participant',
      ns
    });
    expect(user).toMatchObject({ name: 'E2E participant', username });
  });

  test(
    'the entry form explains why an unchecked age box blocks it',
    knownBug(6),
    async ({ page, request }, testInfo) => {
      const giveaway = await seedFormGiveaway(request, testInfo);

      await page.goto(`/browse/${giveaway.id}`);
      await page.getByLabel(X_PROFILE).fill(`https://x.com/e2e${ns}`);
      await submitForm(page);

      await expect(page.getByRole('checkbox', { name: AGE })).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      await expect(
        page.getByText('You must confirm you meet the age requirement')
      ).toBeVisible();
    }
  );

  test(
    'the entry form accepts the X profile URL that its placeholder suggests',
    knownBug(8),
    async ({ page, request }, testInfo) => {
      const giveaway = await seedFormGiveaway(request, testInfo);

      await page.goto(`/browse/${giveaway.id}`);
      const profile = page.getByLabel(X_PROFILE);
      await expect(profile).toHaveAttribute(
        'placeholder',
        'https://twitter.com/username'
      );
      await page.getByRole('checkbox', { name: AGE }).check();
      await profile.fill(`https://twitter.com/e2e${ns}`);
      await submitForm(page);

      await expectTasks(page);
    }
  );

  test('a participant can leave the optional X profile blank', async ({
    page,
    request
  }, testInfo) => {
    const giveaway = await seedFormGiveaway(request, testInfo);

    await page.goto(`/browse/${giveaway.id}`);
    await page.getByRole('checkbox', { name: AGE }).check();
    await submitForm(page);

    await expectTasks(page);
  });
});
