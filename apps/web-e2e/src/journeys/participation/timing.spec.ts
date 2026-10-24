import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

type Participants = { participants: { userId: string }[] };

const BONUS = 'Claim a free entry';
const AUDIENCE = { allowedIdentities: ['GOOGLE' as const], formFields: [] };

test.describe('the dates of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test.beforeEach(async ({ request, freshPersona }) => {
    const { ns } = await freshPersona('participant');
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
      ]
    });
  });

  test('[ENTRY-004] a participant gains no entries from a giveaway that has ended', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      preset: 'ended',
      audience: AUDIENCE,
      tasks: [
        { type: 'BONUS_TASK', title: BONUS },
        { type: 'BONUS_COMPLETE_PROFILE', title: 'Complete your profile' }
      ]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText('Winners Being Selected')).toBeVisible();
    await expect(page.getByText('Your entries: 0')).toBeVisible();

    const { participants } = await seedApi(request).rows<Participants>({
      view: 'participants',
      id: giveaway.id
    });
    expect(participants).toEqual([]);
  });

  test(
    'a signed-in participant is shown as signed in on a giveaway that has ended',
    knownBug(521),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug,
        preset: 'ended',
        audience: AUDIENCE,
        tasks: [{ type: 'BONUS_TASK', title: BONUS }]
      });

      await page.goto(`/browse/${giveaway.id}`);
      await expect(page.getByText('Winners Being Selected')).toBeVisible();

      await expect(page.getByText('Signed in as')).toBeVisible();
      await expect(page.getByText('Not signed in')).toBeHidden();
    }
  );

  test('[ENTRY-004] a participant cannot enter a giveaway that has not started', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      preset: 'scheduled',
      startsIn: 3600,
      audience: AUDIENCE,
      tasks: [
        { type: 'BONUS_TASK', title: BONUS },
        { type: 'BONUS_COMPLETE_PROFILE', title: 'Complete your profile' }
      ]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await expect(
      page.getByRole('heading', { name: 'Giveaway Starting Soon' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: BONUS })).toBeHidden();

    const { participants } = await seedApi(request).rows<Participants>({
      view: 'participants',
      id: giveaway.id
    });
    expect(participants).toEqual([]);
  });

  test(
    '[ENTRY-004] a participant outside the region cannot enter when the giveaway goes live',
    { tag: '@slow' },
    async ({ page, request }, testInfo) => {
      const startsIn = 15;
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug,
        preset: 'scheduled',
        startsIn,
        audience: {
          ...AUDIENCE,
          regionalRestriction: { regions: ['country:US'], filter: 'INCLUDE' }
        },
        tasks: [{ type: 'BONUS_TASK', title: BONUS }]
      });
      const pending = page.getByRole('heading', {
        name: /^Giveaway (Starting Soon|Has Started!)$/
      });

      await page.goto(`/browse/${giveaway.id}`);
      await expect(pending).toHaveText('Giveaway Starting Soon');
      await expect(pending).toHaveText('Giveaway Has Started!', {
        timeout: (startsIn + 5) * 1000
      });
      await page.getByRole('button', { name: 'Refresh Page' }).click();

      await expect(
        page.getByText('You are not eligible to participate in this giveaway.')
      ).toBeVisible();
    }
  );
});
