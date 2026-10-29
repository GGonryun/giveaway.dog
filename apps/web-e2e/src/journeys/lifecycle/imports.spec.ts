import type { Page } from '@playwright/test';
import { E2E_X_FIXTURES } from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { openStep } from '../../helpers/editor';
import { requireFakes, runJobs, seedSweepstakes } from '../../helpers/jobs';
import {
  expectSaved,
  openEditor,
  readParticipants,
  saveChanges
} from '../../helpers/manage';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';

const POST_URL = `https://x.com/e2e_fixture/status/${E2E_X_FIXTURES.tweet}`;

const BACKOFF_MS = 2 * 60_000;

const addRepostImport = async (page: Page, postUrl: string) => {
  await page.getByRole('button', { name: 'Add Entry Method' }).click();
  const dialog = page.getByRole('dialog', { name: 'Entry Methods' });
  await dialog.getByRole('tab', { name: /^Import Tasks/ }).click();
  await dialog.getByText('Repost on X', { exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByLabel('Post ID').fill(postUrl);
};

test.describe('the import tasks of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test.beforeEach(async ({ request }) => {
    await requireFakes(request, ['scrapebadger']);
  });

  test('an X repost import adds the reposters as entrants and gives each entrant without a prize one', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const { team } = await seed.team({ ns, suffix: 'im' });
    const giveaway = await seedSweepstakes(request, {
      ns,
      team: team.slug,
      prizes: [{ name: 'Golden Bone' }, { name: 'Silver Leash' }],
      criteria: { allowUserSelection: true },
      entries: [
        { persona: 'participant', completions: [{ task: 0 }], prize: 1 }
      ]
    });
    await signInAs(page.request, 'host', ns);

    await openEditor(page, team.slug, giveaway.id);
    await openStep(page, 'Tasks');
    await addRepostImport(page, POST_URL);
    await saveChanges(page);
    await expectSaved(page);

    const run = await runJobs(request, giveaway.id);

    expect(run.jobs.sweepstakes).toContainEqual(
      expect.objectContaining({
        type: 'RANDOMLY_ASSIGN_PRIZES',
        status: 'COMPLETED',
        error: null
      })
    );
    const pending = run.jobs.tasks.filter(
      ({ status }) => status !== 'COMPLETED'
    );
    expect(pending).toEqual([expect.objectContaining({ status: 'PENDING' })]);
    expect(new Date(pending[0].runAt!).getTime()).toBeGreaterThan(
      Date.now() + BACKOFF_MS
    );

    const participants = await readParticipants(request, giveaway.id);
    expect(participants).toHaveLength(E2E_X_FIXTURES.retweeters + 1);
    const [seeded] = giveaway.entries;
    const prizeIds = giveaway.prizes.map(({ id }) => id);
    expect(
      participants.find(({ userId }) => userId === seeded.userId)?.prizeId
    ).toBe(prizeIds[1]);
    const imported = participants.filter(
      ({ userId }) => userId !== seeded.userId
    );
    expect(imported).toHaveLength(E2E_X_FIXTURES.retweeters);
    for (const { completions, prizeId } of imported) {
      expect(completions).toBe(1);
      expect(prizeIds).toContain(prizeId);
    }
  });
});
