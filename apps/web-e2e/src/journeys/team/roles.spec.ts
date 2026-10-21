import type { Page } from '@playwright/test';
import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { signInAs } from '../../helpers/personas';
import {
  captureServerAction,
  readActionResult,
  replayServerAction,
  rewriteServerActions
} from '../../helpers/rsc';
import { seedApi } from '../../helpers/seed';
import {
  captureCompleteAction,
  openAs,
  seedEndedWithWinner,
  seedRolesTeam,
  sweepstakesStatus
} from '../../helpers/teams';

const renameTeam = async (page: Page, slug: string, name: string) => {
  await page.goto(`/app/${slug}/settings/profile`);
  const input = page.getByRole('textbox', { name: 'My Team' });
  const save = page.getByRole('button', { name: 'Save' }).first();
  await expect(async () => {
    await input.fill(name);
    await expect(save).toBeEnabled({ timeout: 1_000 });
  }).toPass();
  await save.click();
};

const expectTeamName = async (page: Page, slug: string, name: string) => {
  await page.goto(`/app/${slug}/settings/profile`);
  await expect(page.getByRole('textbox', { name: 'My Team' })).toHaveValue(
    name
  );
};

const memberRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ hasText: name });

const openMemberAction = async (
  page: Page,
  name: string,
  action: 'Edit Member' | 'Remove Member'
) => {
  await memberRow(page, name)
    .getByRole('button', { name: 'Member actions' })
    .click();
  await page.getByRole('menuitem', { name: action }).click();
};

test.describe('team roles', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test.describe('settings', () => {
    test.use({
      allowedPageErrors: [
        /Required permission|didn't match the client properties|ClientFetchError/
      ]
    });

    for (const persona of ['guest', 'member'] as const) {
      test(`[ROLE-002] a ${persona} cannot change the team profile, socials or members`, async ({
        page,
        request,
        browser
      }, testInfo) => {
        const ns = freshNamespace(testInfo.workerIndex);
        const { team } = await seedRolesTeam(request, ns);
        await signInAs(page.request, persona, ns);

        await renameTeam(page, team.slug, 'Renamed by e2e');
        await expect(
          page.getByText(/Required permission: MANAGE_ROLES/)
        ).toBeVisible();

        await page.goto(`/app/${team.slug}/settings/socials`);
        const url = page.getByRole('textbox', {
          name: 'https://x.com/username'
        });
        await expect(async () => {
          if ((await url.count()) === 0) {
            await page.getByRole('button', { name: 'Add Social Link' }).click();
          }
          await expect(url).toBeVisible({ timeout: 1_000 });
        }).toPass();
        await url.fill('https://x.com/e2e');
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(
          page.getByText(/Required permission: MANAGE_SOCIAL_LINKS/)
        ).toBeVisible();

        await page.goto(`/app/${team.slug}/settings/team`);
        await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`));

        const owner = await openAs(browser, 'host', ns);
        await expectTeamName(owner.page, team.slug, team.name);
        await owner.page.goto(`/app/${team.slug}/settings/socials`);
        await expect(
          owner.page.getByText('No social links added yet', { exact: false })
        ).toBeVisible();
        await owner.context.close();
      });
    }
  });

  test('[ROLE-003][ROLE-004] an admin manages invites and members, but not roles or the team name', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    await signInAs(page.request, 'admin', ns);
    await page.goto(`/app/${team.slug}/settings/team`);

    await page.getByRole('button', { name: 'Invite Link' }).click();
    const dialog = page.getByRole('dialog');
    const link = dialog.getByRole('textbox');
    await expect(link).toHaveValue(/\/invites\//);
    const before = await link.inputValue();
    await dialog.getByRole('button', { name: 'Regenerate' }).click();
    await expect(
      page.getByText('Invite link regenerated successfully')
    ).toBeVisible({ timeout: 15_000 });
    await expect(link).not.toHaveValue(before);
    await expect(link).toHaveValue(/\/invites\//);
    await dialog.getByRole('button', { name: 'Done' }).click();

    await openMemberAction(page, 'E2E member', 'Remove Member');
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Remove Member' })
      .click();
    await expect(page.getByText('Member removed successfully')).toBeVisible();
    await expect(memberRow(page, 'E2E member')).toHaveCount(0);

    await openMemberAction(page, 'E2E guest', 'Edit Member');
    await page.getByRole('dialog').getByRole('combobox').click();
    await page.getByRole('option', { name: 'Admin' }).click();
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText(/MANAGE_ROLES/)).toBeVisible();
    await page.keyboard.press('Escape');

    await openMemberAction(page, 'E2E host', 'Remove Member');
    const refusal = page.getByRole('alertdialog');
    await expect(
      refusal.getByRole('heading', { name: 'Cannot Remove Member' })
    ).toBeVisible();
    await expect(refusal).toContainText('Cannot remove the team owner');
    await refusal.getByRole('button', { name: 'Close' }).click();

    await renameTeam(page, team.slug, 'Renamed by e2e');
    await expect(page.getByText(/MANAGE_ROLES/)).toBeVisible();

    const { members } = await seedApi(request).teamRows(team.slug);
    expect(members).not.toContainEqual(
      expect.objectContaining({ email: toE2ePersonaEmail('member', ns) })
    );
    expect(members).toContainEqual(
      expect.objectContaining({
        email: toE2ePersonaEmail('guest', ns),
        role: 'GUEST'
      })
    );
    await expectTeamName(page, team.slug, team.name);
  });

  test(
    '[ROLE-005] an admin cannot make someone an owner through an email invite',
    knownBug(434),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedRolesTeam(request, ns);
      await signInAs(page.request, 'admin', ns);
      await page.goto(`/app/${team.slug}/settings/team`);

      await page
        .getByRole('textbox', { name: 'Email Address' })
        .fill(toE2ePersonaEmail('participant', ns));
      await page.getByRole('combobox', { name: 'Role' }).click();
      await page.getByRole('option', { name: 'Admin' }).click();

      const rewrite = await rewriteServerActions(page, (args) =>
        JSON.parse(
          JSON.stringify(args).replaceAll('"role":"ADMIN"', '"role":"OWNER"')
        )
      );
      await page.getByRole('button', { name: 'Send Invitations' }).click();
      await expect.poll(() => rewrite.responses.length).toBeGreaterThan(0);
      await rewrite.stop();

      expect(readActionResult(rewrite.responses[0])).toMatchObject({
        ok: false
      });
      await page.reload();
      await page.getByRole('tab', { name: /Pending/ }).click();
      await expect(
        page.getByRole('tab', { name: 'Pending (0)' })
      ).toBeVisible();
    }
  );

  test('[ROLE-006] a guest cannot disconnect the team Twitch channel', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    await seedApi(request).integrations({
      team: team.slug,
      integrations: [{ provider: 'TWITCH' }]
    });
    await signInAs(page.request, 'guest', ns);
    await page.goto(`/app/${team.slug}/settings/integrations`);

    await page.getByRole('button', { name: 'Disconnect' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Disconnect' })
      .click();
    const result = page.getByText(
      /Twitch disconnected successfully|Failed to disconnect Twitch/
    );
    await expect(result).toBeVisible();
    await expect(result).toHaveText(/Failed to disconnect Twitch/);

    const owner = await openAs(browser, 'host', ns);
    await owner.page.goto(`/app/${team.slug}/settings/integrations`);
    await expect(
      owner.page.getByRole('link', { name: 'Profile', exact: true })
    ).toBeVisible();
    await owner.context.close();
  });

  test('[ROLE-006] a guest cannot install the Discord bot or disconnect Discord', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    await signInAs(page.request, 'guest', ns);
    await page.goto(`/app/${team.slug}/settings/integrations`);

    await page.getByRole('button', { name: 'Install Bot' }).first().click();
    await expect(
      page.getByText(/Required permission: UPDATE_INTEGRATIONS/)
    ).toBeVisible();

    await seedApi(request).integrations({
      team: team.slug,
      integrations: [{ provider: 'DISCORD' }]
    });
    await page.reload();
    await page.getByRole('button', { name: 'Disconnect' }).click();
    const confirm = page.getByRole('alertdialog');
    if (await confirm.isVisible()) {
      await confirm.getByRole('button', { name: 'Disconnect' }).click();
    }
    await expect(
      page.getByText(/Failed to disconnect Discord: .*UPDATE_INTEGRATIONS/)
    ).toBeVisible();
  });
});

test.describe('roles that check only membership', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({
    allowedPageErrors: [/Failed to load resource: net::ERR_FAILED/]
  });

  test('[ROLE-007] a guest or a blocked member cannot complete a giveaway', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const giveaway = await seedEndedWithWinner(
      request,
      ns,
      team.slug,
      'participant'
    );
    await signInAs(page.request, 'host', ns);
    const complete = await captureCompleteAction(page, team.slug, giveaway);

    for (const persona of ['guest', 'blocked'] as const) {
      const member = await openAs(browser, persona, ns);
      await member.page.goto('/app?step=1');
      const result = readActionResult(
        await replayServerAction(member.page, complete)
      );
      expect(result, persona).toMatchObject({
        ok: false,
        data: { code: 'FORBIDDEN' }
      });
      await member.context.close();
    }

    expect(await sweepstakesStatus(request, giveaway)).toBe('ACTIVE');
  });

  test('[ROLE-008] a guest cannot draw winners', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const giveaway = await seedApi(request).sweepstakes({
      ns,
      team: team.slug,
      preset: 'ended',
      entries: [
        { persona: 'participant', completions: [{ task: 0 }], quality: 100 }
      ]
    });
    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/sweepstakes/${giveaway.id}/winners`);
    const roll = await captureServerAction(
      page,
      () => page.getByRole('button', { name: 'Pick All Winners' }).click(),
      { abort: true }
    );

    const guest = await openAs(browser, 'guest', ns);
    await guest.page.goto('/app?step=1');
    expect(
      readActionResult(await replayServerAction(guest.page, roll))
    ).toMatchObject({ ok: false, data: { code: 'FORBIDDEN' } });
    await guest.context.close();

    const { byResult } = await seedApi(request).rows<{
      byResult: Record<string, number>;
    }>({ view: 'draws', id: giveaway.id });
    expect(byResult).toEqual({});
  });
});
