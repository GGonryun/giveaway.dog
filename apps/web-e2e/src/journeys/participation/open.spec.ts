import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { freshSlug, seedApi, seedWorkerTeam } from '../../helpers/seed';

test.describe('a published giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a visitor opens it by its id and by its slug', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const slug = freshSlug(testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      slug,
      description: '<p>Win a <strong>signed poster</strong> today.</p>',
      tasks: [
        { type: 'BONUS_TASK', title: 'Claim a free entry', value: 1 },
        {
          type: 'ASK_QUESTION',
          title: 'Tell us about you',
          question: 'What is your favorite color?',
          value: 2
        }
      ],
      prizes: [{ name: 'Signed poster' }]
    });

    for (const path of [giveaway.id, slug]) {
      await test.step(`/browse/${path}`, async () => {
        await page.goto(`/browse/${path}`);

        await expect(
          page.getByRole('heading', { name: giveaway.name, level: 1 })
        ).toBeVisible();
        await expect(
          page.getByText(`by ${team.name}`, { exact: true })
        ).toBeVisible();
        await expect(page.getByText(/^Ends in /)).toBeVisible();
        await expect(page.getByText('0 total entries')).toBeVisible();
        await expect(page.getByText('Not signed in')).toBeVisible();
        await expect(page.getByText('signed poster today.')).toBeVisible();
        await expect(
          page.getByRole('link', { name: 'Sign In' })
        ).toHaveAttribute(
          'href',
          `/login?${new URLSearchParams({ redirectTo: `/browse/${path}` })}`
        );
        await expect(
          page.getByRole('link', { name: team.name })
        ).toHaveAttribute('href', `/browse?hosts=${team.slug}`);

        await page.getByRole('tab', { name: 'Tasks' }).click();
        await expect(
          page.getByRole('heading', { name: 'Claim a free entry' })
        ).toBeVisible();
        await expect(page.getByText('+1', { exact: true })).toBeVisible();
        await expect(page.getByText('+2', { exact: true })).toBeVisible();

        await page.getByRole('tab', { name: 'Prizes' }).click();
        await expect(
          page.getByRole('heading', { name: 'Signed poster' })
        ).toBeVisible();
        await expect(page.getByText('1 winner', { exact: true })).toBeVisible();

        await page.getByRole('button', { name: 'Terms & Conditions' }).click();
        const terms = page.getByRole('dialog', { name: 'Terms & Conditions' });
        await expect(terms).toContainText(`sponsored by ${team.name}`);
        await expect(terms).toContainText(
          "1 winner will receive 'Signed poster'"
        );
        await page.keyboard.press('Escape');
        await expect(terms).toBeHidden();
      });
    }
  });

  test('a visitor gets a 404 for a giveaway that does not exist', async ({
    request
  }) => {
    const response = await request.get(`/browse/nope-${RUN_ID}`);

    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('Content not found');
  });
});
