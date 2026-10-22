import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

type Participants = { participants: { userId: string }[] };

test.describe('withdrawing from a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({
    allowedPageErrors: [
      /Failed to fetch\. Read more at https:\/\/errors\.authjs\.dev/
    ]
  });

  test('a participant withdraws from a running giveaway and starts over', async ({
    page,
    browser,
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
      audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
      tasks: [
        { type: 'BONUS_TASK', title: 'Claim a free entry' },
        { type: 'BONUS_TASK', title: 'Claim another entry' }
      ],
      entries: [
        { persona: 'participant', ns, completions: [{ task: 0 }, { task: 1 }] }
      ]
    });

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText('Your entries: 2')).toBeVisible();

    await page.goto('/account/history');
    const row = page.getByRole('row').filter({ hasText: giveaway.name });
    await row.getByRole('button', { name: 'Row actions' }).click();
    await page.getByRole('menuitem', { name: 'Withdraw' }).click();
    const dialog = page.getByRole('alertdialog', {
      name: 'Withdraw from Giveaway'
    });
    await expect(dialog).toContainText(giveaway.name);
    await dialog.getByRole('button', { name: 'Withdraw' }).click();

    await expect(
      page.getByText('Successfully withdrew from giveaway')
    ).toBeVisible();
    await expect(row).toBeHidden();

    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText('Your entries: 0')).toBeVisible();

    const host = await browser.newContext({
      storageState: personaState('host')
    });
    const hostPage = await host.newPage();
    await hostPage.goto(
      `/app/${team.slug}/sweepstakes/${giveaway.id}/participants`
    );
    await expect(hostPage.getByText(/ of 0 participants$/)).toBeVisible();
    await host.close();
  });

  test('a participant cannot withdraw from a giveaway that has ended', async ({
    page,
    request,
    freshPersona
  }, testInfo) => {
    const { ns } = await freshPersona('participant');
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      preset: 'ended',
      tasks: [{ type: 'BONUS_TASK', title: 'Claim a free entry' }],
      entries: [{ persona: 'participant', ns, completions: [{ task: 0 }] }]
    });

    await page.goto('/account/history');
    const row = page.getByRole('row').filter({ hasText: giveaway.name });
    await row.getByRole('button', { name: 'Row actions' }).click();

    await expect(page.getByRole('menuitem', { name: 'View' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Withdraw' })).toBeHidden();
    const { participants } = await seedApi(request).rows<Participants>({
      view: 'participants',
      id: giveaway.id
    });
    expect(participants).toHaveLength(1);
  });
});
