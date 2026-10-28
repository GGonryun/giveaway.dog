import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import {
  captureServerAction,
  readActionResult,
  replayServerAction
} from '../../helpers/rsc';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BONUS = 'Claim a free entry';
const LIMITED = 'Be one of the first fans';
const LOYALTY = 'Come back for more';

const tasksPanel = (page: Page) =>
  page.getByRole('tabpanel', { name: 'Tasks' });

test.describe('limited and loyalty bonuses', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ allowedPageErrors: [/Failed to load resource: net::ERR_FAILED/] });

  test.beforeEach(async ({ request, freshPersona }, testInfo) => {
    const { ns } = await freshPersona('participant');
    await seedApi(request).userExtras({
      ns: RUN_ID,
      users: [
        { persona: 'participant', ns, accounts: [{ identity: 'GOOGLE' }] }
      ]
    });
    testInfo.annotations.push({ type: 'ns', description: ns });
  });

  test('a participant cannot claim a limited bonus that is full', async ({
    page,
    request
  }, testInfo) => {
    const ns = testInfo.annotations.find(
      ({ type }) => type === 'ns'
    )!.description!;
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
      tasks: [
        { type: 'BONUS_TASK', title: BONUS },
        { type: 'BONUS_LIMITED', title: LIMITED, maxEntrants: 1, value: 5 }
      ],
      entries: [{ persona: 'participant2', ns, completions: [{ task: 1 }] }]
    });
    const limited = giveaway.tasks.find((task) => task.title === LIMITED)!;

    await page.goto(`/browse/${giveaway.id}`);
    await page.getByRole('heading', { name: LIMITED }).click();
    await expect(
      tasksPanel(page).getByText(
        'This task has reached its maximum number of entrants.'
      )
    ).toBeVisible();

    await page.goto(`/browse/${giveaway.id}`);
    await page.getByRole('heading', { name: BONUS }).click();
    const action = await captureServerAction(
      page,
      () => page.getByRole('button', { name: 'Continue' }).click(),
      { abort: true }
    );
    const result = readActionResult(
      await replayServerAction(page, action, [
        { taskId: limited.id, sweepstakesId: giveaway.id }
      ])
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.data.message).toBe(
      'This bonus limited task has reached its maximum number of entrants.'
    );
    await page.goto(`/browse/${giveaway.id}`);
    await expect(page.getByText('Your entries: 0')).toBeVisible();
  });

  test('a loyalty bonus unlocks once the participant entered another giveaway of the host', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const first = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
      tasks: [{ type: 'BONUS_TASK', title: BONUS }]
    });
    const second = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      audience: { allowedIdentities: ['GOOGLE'], formFields: [] },
      tasks: [{ type: 'BONUS_LOYALTY', title: LOYALTY, loyaltyRequired: 1 }]
    });
    const locked = tasksPanel(page).getByText(
      /Unlocks after participating in 1 sweepstakes with this host/
    );

    await page.goto(`/browse/${second.id}`);
    await page.getByRole('heading', { name: LOYALTY }).click();
    await expect(locked).toBeVisible();

    await page.goto(`/browse/${first.id}`);
    await page.getByRole('heading', { name: BONUS }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();

    await page.goto(`/browse/${second.id}`);
    await page.getByRole('heading', { name: LOYALTY }).click();
    await expect(locked).toBeHidden();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Task completed!')).toBeVisible();
  });
});
