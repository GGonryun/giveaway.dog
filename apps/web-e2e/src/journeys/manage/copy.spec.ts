import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import { openStep } from '../../helpers/editor';
import { knownBug } from '../../helpers/known-bug';
import {
  freshGiveawayNamespace,
  openRowMenu,
  readParticipants,
  readSweepstakes
} from '../../helpers/manage';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const COPY_BUG = 533;

const seedFullGiveaway = (
  request: APIRequestContext,
  team: string,
  testInfo: { workerIndex: number }
) => {
  const { ns, slug } = freshGiveawayNamespace(testInfo);
  return seedApi(request).sweepstakes({
    ns,
    slug,
    team,
    tasks: [
      { type: 'BONUS_TASK' },
      { type: 'VISIT_URL', href: 'https://example.com/' }
    ],
    prizes: [{ name: 'Golden Bone' }, { name: 'Silver Bone' }],
    audience: {
      allowedIdentities: ['GOOGLE', 'DISCORD'],
      requirePreEntryLogin: true,
      formFields: [{ type: 'USERNAME', label: 'Your username' }]
    },
    criteria: { allowUserSelection: true },
    entries: [{ persona: 'participant', completions: [{ task: 0 }] }]
  });
};

const copyFromDashboard = async (page: Page, team: string, name: string) => {
  const menu = await openRowMenu(page, team, name);
  await menu.getByRole('menuitem', { name: 'Copy' }).click();
  await expect(page.getByText('Sweepstakes copied successfully')).toBeVisible({
    timeout: 30_000
  });
  await expect(page).toHaveURL(
    new RegExp(`/app/${team}/sweepstakes/[A-Za-z0-9_-]{6}/create$`),
    { timeout: 30_000 }
  );
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
    `${name} (Copy)`
  );
  return new URL(page.url()).pathname.split('/')[4];
};

test.describe('copying a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test(
    '[COPY-001] a copy keeps every setting of the original and is a private draft with no slug',
    knownBug(COPY_BUG),
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const original = await seedFullGiveaway(request, team.slug, testInfo);

      const id = await copyFromDashboard(page, team.slug, original.name);
      expect(id).not.toBe(original.id);
      expect(await readSweepstakes(request, id)).toMatchObject({
        status: 'DRAFT',
        visibility: { visibility: 'PRIVATE', slug: null },
        _count: { participants: 0, tasks: 2, prizes: 2 }
      });

      await openStep(page, 'Selection');
      await expect(
        page.getByRole('switch', { name: 'Allow Prize Selection' })
      ).toBeChecked();
      await openStep(page, 'Audience');
      await expect(
        page.getByRole('button', { name: 'Remove Username', exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('switch', { name: 'Require Pre-Entry Login' })
      ).toBeChecked();
      await expect(
        page.getByRole('button', { name: 'Allowed Identities' })
      ).toHaveText(/^\s*Google\s*Discord\s*$/);
    }
  );

  test('[COPY-002] copying a giveaway leaves the original unchanged', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const original = await seedFullGiveaway(request, team.slug, testInfo);
    const before = await readSweepstakes(request, original.id);
    const participants = await readParticipants(request, original.id);

    await copyFromDashboard(page, team.slug, original.name);

    expect(await readSweepstakes(request, original.id)).toEqual(before);
    expect(await readParticipants(request, original.id)).toEqual(participants);
  });
});
