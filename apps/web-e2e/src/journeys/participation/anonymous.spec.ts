import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BONUS = 'Claim a free entry';

test.describe('an anonymous entry', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  let anonymousId: string | undefined;

  test.afterEach(async ({ request }) => {
    if (anonymousId) await seedApi(request).deleteAnonymousUser(anonymousId);
    anonymousId = undefined;
  });

  test('a visitor enters a giveaway that accepts anonymous entries', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: {
        allowedIdentities: ['ANONYMOUS'],
        requirePreEntryLogin: true,
        formFields: []
      },
      tasks: [{ type: 'BONUS_TASK', title: BONUS }]
    });
    const path = `/browse/${giveaway.id}`;

    await page.goto(path);
    await expect(page.getByText('Connect to participate...')).toBeVisible();
    await page.getByRole('button', { name: 'Anonymous' }).click();
    await expect
      .poll(async () => {
        const session = await page.request.get('/api/auth/session');
        anonymousId = (await session.json())?.user?.id;
        return anonymousId;
      })
      .toEqual(expect.any(String));

    await expect(page).toHaveURL(path);
    await expect(page.getByText('Signed in as')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Anonymous' })).toBeVisible();

    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Your entries: 1')).toBeVisible();
  });
});
