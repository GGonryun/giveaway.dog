import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { headerButton } from '../../helpers/editor';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

test.describe('the editor of a live giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('a host cannot delete a live giveaway with "Delete Draft"', async ({
    page,
    request
  }, testInfo) => {
    const seed = seedApi(request);
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seed.sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      entries: [
        {
          persona: 'participant',
          ns: `${RUN_ID}dd${testInfo.parallelIndex}`,
          completions: [{ task: 0 }]
        }
      ]
    });

    await page.goto(`/app/${team.slug}/sweepstakes/${giveaway.id}/create`);
    await headerButton(page, 'Cancel').click();

    await expect(
      page.getByRole('button', { name: 'Delete Draft' })
    ).toHaveCount(0);
    const { sweepstakes } = await seed.rows<{
      sweepstakes: { status: string; _count: { participants: number } };
    }>({ view: 'sweepstakes', id: giveaway.id });
    expect(sweepstakes).toMatchObject({
      status: 'ACTIVE',
      _count: { participants: 1 }
    });
  });
});
