import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET, RUN_ID } from '../../env';
import { readParticipants, readSweepstakes } from '../../helpers/manage';
import { signInAs } from '../../helpers/personas';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const DELETE_TIMEOUT = 20_000;

const deleteAccount = async (page: Page) => {
  await page.goto('/account/danger-zone');
  await page.getByRole('button', { name: 'Delete Account' }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete Account' })
    .click();
  await expect(page).toHaveURL(/\/$/, { timeout: DELETE_TIMEOUT });
};

test.describe('account deletion', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-026] a deleted participant is gone from the giveaways they entered', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      entries: [{ persona: 'participant', ns }]
    });
    const [entry] = giveaway.entries;
    await signInAs(page.request, 'participant', ns);

    await deleteAccount(page);

    const participants = await readParticipants(request, giveaway.id);
    expect(participants.map((participant) => participant.userId)).not.toContain(
      entry.userId
    );
  });

  test("[ACCOUNT-027] a deleted host's team keeps its giveaways and templates", async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedApi(request).team({
      ns,
      suffix: 'del',
      members: [{ persona: 'admin', role: 'ADMIN' }]
    });
    const giveaway = await seedApi(request).sweepstakes({
      ns,
      team: team.slug
    });
    const {
      templates: [template]
    } = await seedApi(request).templates({
      team: team.slug,
      templates: [{ name: `[e2e ${ns}] Kept template` }]
    });
    await signInAs(page.request, 'host', ns);

    await deleteAccount(page);

    expect((await readSweepstakes(request, giveaway.id)).id).toBe(giveaway.id);
    expect(
      (await seedApi(request).templateRows(team.slug)).map(({ id }) => id)
    ).toContain(template.id);
    const { members } = await seedApi(request).teamRows(team.slug);
    expect(members.map(({ role }) => role)).toEqual(['ADMIN']);
  });

  test('[ACCOUNT-028] the deletion dialog says that the account is deleted at once', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('participant');
    await page.goto('/account/danger-zone');

    await page.getByRole('button', { name: 'Delete Account' }).click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('permanently deleted');
    await expect(dialog).not.toContainText(/processed after/);
  });
});
