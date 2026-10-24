import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, personaState } from '../../env';
import { addPrize, addTask, openStep, pickDate } from '../../helpers/editor';
import {
  expectSaved,
  openEditor,
  readParticipants,
  readSweepstakes,
  removeEntryMethod,
  saveChanges
} from '../../helpers/manage';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import {
  eligibleEntries,
  endedGiveaway,
  readCompletions,
  readDraws,
  winnersPage
} from '../../helpers/winners';

const REFERRAL_BUG = 529;
const DRAWS_BUG = 528;
const CREATED_AT_BUG = 530;

const completionKeys = async (request: APIRequestContext, id: string) =>
  (await readCompletions(request, id)).completions
    .map(({ id, taskId, status, userId }) => ({ id, taskId, status, userId }))
    .sort((a, b) => a.id.localeCompare(b.id));

const participantKeys = async (request: APIRequestContext, id: string) =>
  (await readParticipants(request, id))
    .map(({ id, userId, formValues, referrals }) => ({
      id,
      userId,
      formValues,
      referrals
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

const seedEnteredGiveaway = async (
  request: APIRequestContext,
  team: string,
  ns: string
) =>
  seedApi(request).sweepstakes({
    ns,
    team,
    tasks: [
      { type: 'BONUS_TASK' },
      { type: 'VISIT_URL', href: 'https://example.com/' },
      { type: 'REFERRAL_LINK' }
    ],
    audience: {
      formFields: [
        { type: 'USERNAME', label: 'Your username' },
        { type: 'AGE', label: 'Your age' }
      ]
    },
    entries: [
      {
        persona: 'participant',
        completions: [{ task: 0 }, { task: 1, status: 'PENDING' }, { task: 2 }],
        formValues: [
          { field: 0, value: 'goodboy' },
          { field: 1, value: '30' }
        ]
      },
      {
        persona: 'participant2',
        completions: [{ task: 0 }, { task: 1 }],
        formValues: [
          { field: 0, value: 'fetcher' },
          { field: 1, value: '41' }
        ]
      },
      { persona: 'newbie', completions: [{ task: 0 }] }
    ],
    referrals: [{ entry: 0, task: 2, referred: [2] }]
  });

test.describe('editing a published giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.slow();
  test.use({ storageState: personaState('host') });

  test('[EDIT-001] the host edits a live giveaway and keeps its participants, entries, answers and referrals', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedEnteredGiveaway(
      request,
      team.slug,
      freshNamespace(testInfo.workerIndex)
    );
    const completions = await completionKeys(request, giveaway.id);
    const participants = await participantKeys(request, giveaway.id);
    expect(completions).toHaveLength(6);
    expect(participants.flatMap((p) => p.referrals)).toHaveLength(1);

    await openEditor(page, team.slug, giveaway.id);
    const renamed = `${giveaway.name} renamed`;
    await page.getByRole('textbox', { name: 'Name' }).fill(renamed);
    await openStep(page, 'Tasks');
    await addTask(page, 'Bonus');
    await openStep(page, 'Prizes');
    await addPrize(page);
    await saveChanges(page);
    await expectSaved(page);

    await expect
      .poll(async () => (await readSweepstakes(request, giveaway.id)).details)
      .toEqual({ name: renamed });
    expect(await readSweepstakes(request, giveaway.id)).toMatchObject({
      _count: { participants: 3, tasks: 4, prizes: 2 }
    });
    expect(await completionKeys(request, giveaway.id)).toEqual(completions);
    expect(await participantKeys(request, giveaway.id)).toEqual(participants);

    await openEditor(page, team.slug, giveaway.id);
    await openStep(page, 'Tasks');
    await removeEntryMethod(page, 'Visit URL');
    await openStep(page, 'Audience');
    await removeEntryMethod(page, 'Age');
    await saveChanges(page);
    await expectSaved(page);

    const [, visitUrl] = giveaway.tasks;
    const [, age] = giveaway.formFields;
    await expect
      .poll(() => completionKeys(request, giveaway.id))
      .toEqual(completions.filter((c) => c.taskId !== visitUrl.id));
    expect(await participantKeys(request, giveaway.id)).toEqual(
      participants.map((participant) => ({
        ...participant,
        formValues: participant.formValues.filter(
          (value) => value.fieldId !== age.id
        )
      }))
    );
  });

  test(
    '[EDIT-002] the host edits an ended giveaway and keeps its winners and re-roll history',
    knownBug(DRAWS_BUG),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes(
        endedGiveaway({
          ns: freshNamespace(testInfo.workerIndex),
          team: team.slug,
          prizes: [{ name: 'Golden Bone', quota: 2 }],
          entries: eligibleEntries(['participant', 'participant2', 'newbie']),
          draws: [
            { entry: 0, prize: 0, result: 'DISQUALIFIED', reason: 'No reply' },
            { entry: 1, prize: 0, previous: 0 },
            { entry: 2, prize: 0 }
          ]
        })
      );
      const before = await readDraws(request, giveaway.id);
      expect(before.byResult).toEqual({ WINNER: 2, DISQUALIFIED: 1 });

      await openEditor(page, team.slug, giveaway.id);
      await pickDate(page, 'End Date', 3);
      await saveChanges(page);
      await expectSaved(page);

      await page.goto(winnersPage(team.slug, giveaway.id));
      await expect(
        page.getByText('2 / 2 winners selected', { exact: true })
      ).toBeVisible();
      expect((await readDraws(request, giveaway.id)).draws).toEqual(
        before.draws
      );
    }
  );

  test.fixme("[EDIT-003] the host edits a giveaway and keeps each participant's secret-code attempts (#528)", () => {});

  test(
    '[EDIT-004] the host removes a referral task that already has referrals',
    knownBug(REFERRAL_BUG),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedEnteredGiveaway(
        request,
        team.slug,
        freshNamespace(testInfo.workerIndex)
      );
      const [, , referral] = giveaway.tasks;
      const completions = await completionKeys(request, giveaway.id);

      await openEditor(page, team.slug, giveaway.id);
      await openStep(page, 'Tasks');
      await removeEntryMethod(page, 'Refer a Friend');
      await saveChanges(page);
      await expectSaved(page);

      await expect
        .poll(() => completionKeys(request, giveaway.id))
        .toEqual(completions.filter((c) => c.taskId !== referral.id));
      const participants = await readParticipants(request, giveaway.id);
      expect(participants.flatMap((p) => p.referrals)).toEqual([]);
    }
  );

  test(
    '[EDIT-005] the host edits a giveaway and it keeps its creation date',
    knownBug(CREATED_AT_BUG),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: freshNamespace(testInfo.workerIndex),
        team: team.slug
      });
      const { createdAt } = await readSweepstakes(request, giveaway.id);

      await openEditor(page, team.slug, giveaway.id);
      await page
        .getByRole('textbox', { name: 'Name' })
        .fill(`${giveaway.name} renamed`);
      await saveChanges(page);
      await expectSaved(page);

      await expect
        .poll(
          async () => (await readSweepstakes(request, giveaway.id)).details.name
        )
        .toBe(`${giveaway.name} renamed`);
      expect((await readSweepstakes(request, giveaway.id)).createdAt).toBe(
        createdAt
      );
    }
  );
});
