import type { Page } from '@playwright/test';
import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { BASE_URL, E2E_SECRET } from '../../env';
import { postCredentials } from '../../helpers/credentials';
import { noRedirect } from '../../helpers/http';
import { knownBug } from '../../helpers/known-bug';
import { fakesOf, linkInEmail, waitForEmail } from '../../helpers/outbox';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';
import { memberRow, openAs, openMemberAction } from '../../helpers/teams';

const readInviteLink = async (page: Page, slug: string) => {
  await page.goto(`/app/${slug}/settings/team`);
  await page.getByRole('button', { name: 'Invite Link' }).click();
  const link = page.getByRole('dialog').getByRole('textbox');
  await expect(link).toHaveValue(/\/invites\/\w+$/);
  return new URL(await link.inputValue()).pathname;
};

const teamChoice = (page: Page, name: string) =>
  page.getByRole('button').filter({ hasText: name });

const acceptInvite = (page: Page) =>
  page.getByRole('button', { name: 'Accept Invitation' }).click();

const inviteByEmail = async (page: Page, email: string) => {
  await page.getByRole('textbox', { name: 'Email Address' }).fill(email);
  await page.getByRole('button', { name: 'Send Invitations' }).click();
};

const changeRole = async (page: Page, name: string, role: string) => {
  await openMemberAction(page, name, 'Edit Member');
  await page.getByRole('dialog').getByRole('combobox').click();
  await page.getByRole('option', { name: role }).click();
  await page.getByRole('button', { name: 'Save Changes' }).click();
};

test.describe('team members', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({
    allowedPageErrors: [/didn't match the client properties|ClientFetchError/]
  });

  test('a host joins a team through its invite link as a member', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const { team } = await seed.team({ ns, suffix: 'lnk', name: `Link ${ns}` });
    await signInAs(page.request, 'host', ns);
    const path = await readInviteLink(page, team.slug);

    const invitee = await openAs(browser, 'member', ns);
    await invitee.page.goto(path);
    await expect(invitee.page.getByText("You've Been Invited!")).toBeVisible();
    await expect(invitee.page.getByText(`Join ${team.name}`)).toBeVisible();
    await expect(invitee.page.getByText('Signed in as')).toBeVisible();
    await expect(invitee.page.getByText(invitee.user!.email)).toBeVisible();
    await acceptInvite(invitee.page);
    await expect(
      invitee.page.getByText(`Successfully joined ${team.name}!`)
    ).toBeVisible();
    await expect(invitee.page.getByText('Welcome to the Team!')).toBeVisible();
    await expect(invitee.page).toHaveURL(/\/app$/);
    await expect(teamChoice(invitee.page, team.name)).toContainText('MEMBER');

    await page.goto(`/app/${team.slug}/settings/team`);
    await expect(page.getByRole('tab', { name: 'Members (2)' })).toBeVisible();
    await expect(memberRow(page, 'E2E member')).toContainText('MEMBER');

    await invitee.page.goto(path);
    await acceptInvite(invitee.page);
    await expect(
      invitee.page.getByText('You are already a member of this team')
    ).toBeVisible();
    await invitee.context.close();

    const { members } = await seed.teamRows(team.slug);
    expect(members).toContainEqual(
      expect.objectContaining({ email: invitee.user!.email, role: 'MEMBER' })
    );
  });

  test('a participant who joins through an invite link lands in the app', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const { team } = await seed.team({ ns, suffix: 'lnk' });
    const { link } = await seed.invites({ ns, team: team.slug, link: {} });
    await signInAs(page.request, 'participant', ns);

    await page.goto(`/invites/${link!.id}`);
    await acceptInvite(page);
    await expect(page.getByText('Welcome to the Team!')).toBeVisible();

    await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });
  });

  test('an owner removes a member, who loses access at once', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedApi(request).team({
      ns,
      suffix: 'rm',
      name: `Remove ${ns}`,
      members: [{ persona: 'member', role: 'MEMBER' }]
    });
    const member = await openAs(browser, 'member', ns);
    await member.context.addCookies([
      { name: 'last_team_slug', value: team.slug, url: BASE_URL }
    ]);
    await member.page.goto('/app');
    await expect(member.page).toHaveURL(new RegExp(`/app/${team.slug}$`));

    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/settings/team`);
    await openMemberAction(page, 'E2E member', 'Remove Member');
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Remove Member' })
      .click();
    await expect(page.getByText('Member removed successfully')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('tab', { name: 'Members (1)' })).toBeVisible();
    await expect(memberRow(page, 'E2E member')).toHaveCount(0);

    await member.page.reload();
    await expect(member.page).toHaveURL(/\/app$/);
    await expect(member.page.getByText('No teams yet')).toBeVisible();
    await member.page.goto('/app');
    await expect(member.page).toHaveURL(/\/app$/);
    await member.context.close();
  });

  test.describe('email invites', () => {
    test.beforeEach(async ({ request }) => {
      const fakes = fakesOf(await seedApi(request).health());
      test.skip(!fakes.includes('email'), 'Set E2E_FAKE_EXTERNALS to email');
    });

    test('an owner invites by email, sees the invite as pending and revokes it', async ({
      page,
      request
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedApi(request).team({ ns, suffix: 'em' });
      const invitee = toE2ePersonaEmail('participant', ns);
      await signInAs(page.request, 'host', ns);
      await page.goto(`/app/${team.slug}/settings/team`);

      await inviteByEmail(page, invitee);
      await expect(page.getByText('Invited 1 member successfully')).toBeVisible(
        { timeout: 30_000 }
      );
      const pending = page.getByRole('tab', { name: 'Pending (1)' });
      await expect(pending).toBeVisible();
      await pending.click();
      const row = page.getByRole('row').filter({ hasText: invitee });
      await expect(row).toContainText('MEMBER');
      const link = linkInEmail(
        await waitForEmail(request, invitee, /invited to join/),
        '/invites/'
      );

      await inviteByEmail(page, invitee);
      await expect(
        page.getByText(`${invitee}: Invitation already sent to this email`)
      ).toBeVisible({ timeout: 30_000 });
      const owner = toE2ePersonaEmail('host', ns);
      await inviteByEmail(page, owner);
      await expect(
        page.getByText(`${owner}: User is already a member of this team`)
      ).toBeVisible({ timeout: 30_000 });

      await page.getByRole('tab', { name: /Pending/ }).click();
      await row.getByRole('button').click();
      await page.getByRole('menuitem', { name: 'Revoke Invitation' }).click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Revoke Invitation' })
        .click();
      await expect(
        page.getByText('Invitation revoked successfully')
      ).toBeVisible();
      await page.reload();
      await expect(
        page.getByRole('tab', { name: 'Pending (0)' })
      ).toBeVisible();

      const revoked = await page.request.get(
        new URL(link).pathname,
        noRedirect
      );
      expect(revoked.status()).toBe(404);
    });

    test('Enter in the invite email field sends the invite', async ({
      page,
      request
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedApi(request).team({ ns, suffix: 'en' });
      await signInAs(page.request, 'host', ns);
      await page.goto(`/app/${team.slug}/settings/team`);

      const email = page.getByRole('textbox', { name: 'Email Address' });
      await email.fill(toE2ePersonaEmail('participant', ns));
      await email.press('Enter');

      await expect(page.getByText('Invited 1 member successfully')).toBeVisible(
        { timeout: 30_000 }
      );
      await expect(page).not.toHaveURL(/invitations/);
    });
  });

  test('only the invited account accepts an email invite, with the role of the invite', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const { team } = await seed.team({ ns, suffix: 'adm' });
    const {
      emails: [invite]
    } = await seed.invites({
      ns,
      team: team.slug,
      emails: [{ persona: 'host2', role: 'ADMIN' }]
    });

    await signInAs(page.request, 'participant', ns);
    await page.goto(`/invites/${invite.id}`);
    await expect(page.getByText("You'll join as:")).toBeVisible();
    await expect(page.getByText('ADMIN', { exact: true })).toBeVisible();
    await acceptInvite(page);
    await expect(
      page.getByText(
        'This invitation was sent to a different email address. Please log in with the correct account.'
      )
    ).toBeVisible();

    const invitee = await openAs(browser, 'host2', ns);
    await invitee.page.goto(`/invites/${invite.id}`);
    await acceptInvite(invitee.page);
    await expect(invitee.page.getByText('Welcome to the Team!')).toBeVisible();
    await invitee.page.goto(`/app/${team.slug}/settings/team`);
    await expect(
      invitee.page.getByRole('tab', { name: 'Pending (0)' })
    ).toBeVisible();
    await expect(memberRow(invitee.page, 'E2E host2')).toContainText('ADMIN');
    await invitee.context.close();

    const { members } = await seed.teamRows(team.slug);
    expect(members).toContainEqual(
      expect.objectContaining({ email: invite.email, role: 'ADMIN' })
    );
    const used = await page.request.get(`/invites/${invite.id}`, noRedirect);
    expect(used.status()).toBe(404);
  });

  test('an owner regenerates the invite link, and the old link stops working', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedApi(request).team({ ns, suffix: 'reg' });
    await signInAs(page.request, 'host', ns);
    const before = await readInviteLink(page, team.slug);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Regenerate' }).click();
    await expect(
      page.getByText('Invite link regenerated successfully')
    ).toBeVisible({ timeout: 15_000 });
    const link = dialog.getByRole('textbox');
    await expect(link).not.toHaveValue(new RegExp(`${before}$`));
    const after = new URL(await link.inputValue()).pathname;

    const visitor = await openAs(browser, null, ns);
    const old = await visitor.page.goto(before);
    expect(old?.status()).toBe(404);
    await expect(visitor.page.getByText('Content not found')).toBeVisible();
    await visitor.page.goto(after);
    await expect(visitor.page.getByText("You've Been Invited!")).toBeVisible();
    await visitor.context.close();
  });

  test('a visitor with an invite link signs in and returns to the invite', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const { team } = await seed.team({
      ns,
      suffix: 'vis',
      name: `Visit ${ns}`
    });
    const { link } = await seed.invites({ ns, team: team.slug, link: {} });
    const path = `/invites/${link!.id}`;

    await page.goto(path);
    await expect(page.getByText(`Join ${team.name}`)).toBeVisible();
    await expect(
      page.getByText('You need to be signed in to accept this invitation.')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Sign In or Sign Up' }).click();
    await expect(page).toHaveURL(
      `/login?${new URLSearchParams({ redirectTo: path })}`
    );

    const signIn = await postCredentials(page.request, 'e2e', {
      secret: E2E_SECRET,
      persona: 'participant',
      ns,
      callbackUrl: `/portal?${new URLSearchParams({ redirectTo: path })}`
    });
    expect(signIn.status()).toBe(302);
    await page.goto(signIn.headers().location);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(
      page.getByRole('button', { name: 'Accept Invitation' })
    ).toBeVisible();
  });

  test('a visitor sees the team logo on the invite page, not its URL', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const seed = seedApi(request);
    const { team } = await seed.team({
      ns,
      suffix: 'logo',
      name: `Logo ${ns}`
    });
    const { link } = await seed.invites({ ns, team: team.slug, link: {} });

    await page.goto(`/invites/${link!.id}`);
    await expect(page.getByText(`Join ${team.name}`)).toBeVisible();
    await expect(page.getByText(/^https?:\/\//)).toHaveCount(0);
    await expect(
      page.getByRole('img', { name: `${team.name} Logo` })
    ).toBeVisible();
  });

  test.describe('roles', () => {
    test('an owner changes a role and transfers the ownership', async ({
      page,
      request,
      browser
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const seed = seedApi(request);
      const { team } = await seed.team({
        ns,
        suffix: 'own',
        members: [
          { persona: 'member', role: 'MEMBER' },
          { persona: 'guest', role: 'GUEST' }
        ]
      });
      await signInAs(page.request, 'host', ns);
      await page.goto(`/app/${team.slug}/settings/team`);

      await changeRole(page, 'E2E member', 'Admin');
      await expect(
        page.getByText('Member role updated successfully')
      ).toBeVisible();
      const member = await openAs(browser, 'member', ns);
      await member.page.goto(`/app/${team.slug}/settings/team`);
      await expect(member.page).toHaveURL(/\/settings\/team$/);
      await expect(
        member.page.getByRole('tab', { name: 'Members (3)' })
      ).toBeVisible();
      await member.context.close();

      await page.reload();
      await changeRole(page, 'E2E host', 'Admin');
      await expect(
        page.getByText(
          'Cannot change the owner role. Transfer ownership first.'
        )
      ).toBeVisible();
      await page.keyboard.press('Escape');

      await page.reload();
      await changeRole(page, 'E2E member', 'Owner');
      await expect(
        page.getByText('Member role updated successfully')
      ).toBeVisible();

      const { members } = await seed.teamRows(team.slug);
      const roles = Object.fromEntries(
        members.map(({ email, role }) => [email, role])
      );
      expect(roles).toEqual({
        [toE2ePersonaEmail('host', ns)]: 'ADMIN',
        [toE2ePersonaEmail('member', ns)]: 'OWNER',
        [toE2ePersonaEmail('guest', ns)]: 'GUEST'
      });

      await page.reload();
      await changeRole(page, 'E2E guest', 'Member');
      await expect(page.getByText(/MANAGE_ROLES/)).toBeVisible();
    });

    test(
      'the edit dialog shows the role of the member it opens for',
      knownBug(71),
      async ({ page, request }, testInfo) => {
        const ns = freshNamespace(testInfo.workerIndex);
        const { team } = await seedApi(request).team({
          ns,
          suffix: 'edit',
          members: [{ persona: 'guest', role: 'GUEST' }]
        });
        await signInAs(page.request, 'host', ns);
        await page.goto(`/app/${team.slug}/settings/team`);

        await openMemberAction(page, 'E2E host', 'Edit Member');
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Cancel' })
          .click();
        await openMemberAction(page, 'E2E guest', 'Edit Member');

        await expect(page.getByRole('dialog').getByRole('combobox')).toHaveText(
          'Guest'
        );
      }
    );
  });

  test.describe('leaving', () => {
    test.use({
      allowedPageErrors: [
        /didn't match the client properties|ClientFetchError|is not a member of team|Team not found/
      ]
    });

    test('an admin leaves a team by removing their own membership', async ({
      page,
      request
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedApi(request).team({
        ns,
        suffix: 'lv',
        name: `Leave ${ns}`,
        members: [{ persona: 'admin', role: 'ADMIN' }]
      });
      await signInAs(page.request, 'admin', ns);
      await page.goto(`/app/${team.slug}/settings/team`);

      await openMemberAction(page, 'E2E admin', 'Remove Member');
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Remove Member' })
        .click();
      await expect(page.getByText('Member removed successfully')).toBeVisible();

      await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });
      await expect(page.getByText('No teams yet')).toBeVisible();
      const { members } = await seedApi(request).teamRows(team.slug);
      expect(members.map(({ email }) => email)).toEqual([
        toE2ePersonaEmail('host', ns)
      ]);
    });
  });

  test('an invalid invite code shows the not found page', async ({
    request
  }) => {
    const response = await request.get('/invites/not-a-code', noRedirect);
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain('Content not found');
  });
});
