import type { Page } from '@playwright/test';
import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { BASE_URL, E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi } from '../../helpers/seed';
import { memberRow } from '../../helpers/teams';

const fillNewTeam = async (page: Page, name: string, slug?: string) => {
  await page.goto('/app?step=2');
  const nameInput = page.getByRole('textbox', { name: 'Team Name' });
  const slugInput = page.getByRole('textbox', { name: 'Team Slug' });
  await expect(async () => {
    await nameInput.clear();
    await nameInput.pressSequentially(name);
    await expect(slugInput).not.toHaveValue('', { timeout: 1_000 });
  }).toPass();
  if (slug) await slugInput.fill(slug);
  return { nameInput, slugInput };
};

const createButton = (page: Page) =>
  page.getByRole('button', { name: 'Create Team' });

const teamChoice = (page: Page, name: string) =>
  page.getByRole('button').filter({ hasText: name });

const teamSwitcher = (page: Page, name: string) =>
  page.locator('[data-sidebar="menu-button"]').filter({ hasText: name });

test.describe('team setup', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({
    allowedPageErrors: [/didn't match the client properties|ClientFetchError/]
  });

  test('a host creates a team and lands in it as its owner', async ({
    page,
    freshPersona
  }) => {
    const host = await freshPersona('host');
    const name = `E2E ${host.ns}`;
    const slug = `e2e-${host.ns}`;

    await page.goto('/app');
    await page.getByRole('button', { name: 'Create your first team' }).click();
    await expect(page).toHaveURL(/\/app\?step=2$/);
    const { slugInput } = await fillNewTeam(page, name);
    await expect(slugInput).toHaveValue(slug);
    await expect(page.getByText(`giveaway.dog/${slug}`)).toBeVisible();
    await createButton(page).click();

    await expect(page.getByText(`Team created: ${slug}`)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/app/${slug}$`));
    await expect(teamSwitcher(page, name)).toBeVisible();

    await page.goto(`/app/${slug}/settings/team`);
    await expect(page.getByRole('tab', { name: 'Members (1)' })).toBeVisible();
    await expect(memberRow(page, 'E2E host')).toContainText('OWNER');
    await page.getByRole('button', { name: 'Invite Link' }).click();
    await expect(page.getByRole('dialog').getByRole('textbox')).toHaveValue(
      /\/invites\/\w+$/
    );
    await page.keyboard.press('Escape');

    const next = await page.context().newPage();
    await next.goto('/app');
    await expect(next).toHaveURL(new RegExp(`/app/${slug}$`));
    await next.close();

    await page.goto('/app?step=1');
    const choice = teamChoice(page, name);
    await expect(choice).toContainText('OWNER');
    await expect(choice).toContainText(`@${slug} • 1 members`);

    const { members } = await seedApi(page.request).teamRows(slug);
    expect(members).toEqual([
      expect.objectContaining({ email: host.email, role: 'OWNER' })
    ]);
  });

  test('a host cannot create a team with a slug that is taken', async ({
    page,
    request,
    freshPersona
  }) => {
    const host = await freshPersona('host');
    const { team } = await seedApi(request).team({
      ns: host.ns,
      suffix: 'dup',
      owner: 'host2'
    });

    const { slugInput } = await fillNewTeam(page, 'E2E taken', team.slug);
    await createButton(page).click();

    await expect(
      page.getByText('This team slug is already taken').first()
    ).toBeVisible();
    await expect(slugInput).toHaveAccessibleDescription(
      /This team slug is already taken/
    );
    await expect(page).toHaveURL(/\/app\?step=2$/);
    const { members } = await seedApi(request).teamRows(team.slug);
    expect(members.map(({ email }) => email)).toEqual([
      toE2ePersonaEmail('host2', host.ns)
    ]);
    await page.goto('/app?step=1');
    await expect(page.getByText('No teams yet')).toBeVisible();
  });

  test.describe('team limit', () => {
    const seedTeams = async (page: Page, ns: string, suffixes: string[]) => {
      for (const suffix of suffixes) {
        await seedApi(page.request).team({
          ns,
          suffix,
          name: `Team ${suffix}`
        });
      }
    };

    test('a host at the team limit cannot create another team', async ({
      page,
      freshPersona
    }) => {
      const host = await freshPersona('host');
      await seedTeams(page, host.ns, ['t1', 't2', 't3', 't4', 't5']);

      await page.goto('/app?step=1');
      await expect(
        page.getByRole('button', { name: 'Team limit reached (5/5)' })
      ).toBeDisabled();
      await expect(
        page.getByText('You can only be a member of up to 5 teams')
      ).toBeVisible();

      await fillNewTeam(page, `E2E ${host.ns}`);
      await createButton(page).click();
      await expect(
        page.getByText('You cannot be a member of more than 5 teams')
      ).toBeVisible();
      await page.goto('/app?step=1');
      await expect(page.getByText(`@e2e-${host.ns} •`)).toHaveCount(0);
    });

    test(
      'a host at the team limit cannot join another team with its invite link',
      knownBug(487),
      async ({ page, request, freshPersona }) => {
        const host = await freshPersona('host');
        await seedTeams(page, host.ns, ['t1', 't2', 't3', 't4', 't5']);
        const seed = seedApi(request);
        const { team } = await seed.team({
          ns: host.ns,
          suffix: 'x',
          owner: 'host2'
        });
        const { link } = await seed.invites({
          ns: host.ns,
          team: team.slug,
          link: {}
        });

        await page.goto(`/invites/${link!.id}`);
        await page.getByRole('button', { name: 'Accept Invitation' }).click();
        await expect(page.locator('[data-sonner-toast]').first()).toBeVisible();

        const { members } = await seed.teamRows(team.slug);
        expect(members.map(({ email }) => email)).not.toContain(host.email);
      }
    );

    test(
      'a blocked membership does not take a place under the team limit',
      knownBug(488),
      async ({ page, request, freshPersona }) => {
        const host = await freshPersona('host');
        await seedTeams(page, host.ns, ['t1', 't2', 't3', 't4']);
        await seedApi(request).team({
          ns: host.ns,
          suffix: 'b',
          owner: 'host2',
          members: [{ persona: 'host', role: 'BLOCKED' }]
        });

        await page.goto('/app?step=1');
        await expect(
          page.getByRole('button', { name: 'Create new team' })
        ).toBeEnabled();
        await fillNewTeam(page, `E2E ${host.ns}`);
        await createButton(page).click();
        await expect(page).toHaveURL(new RegExp(`/app/e2e-${host.ns}$`));
      }
    );
  });

  test('a host switches teams and returns to the last one', async ({
    page,
    request,
    freshPersona
  }) => {
    const host = await freshPersona('host');
    const seed = seedApi(request);
    const { team: first } = await seed.team({
      ns: host.ns,
      suffix: 'a',
      name: 'Team Alpha'
    });
    const { team: second } = await seed.team({
      ns: host.ns,
      suffix: 'b',
      name: 'Team Bravo'
    });
    const { team: other } = await seed.team({
      ns: host.ns,
      suffix: 'o',
      owner: 'host2'
    });

    await page.goto('/app?step=1');
    for (const team of [first, second]) {
      const choice = teamChoice(page, team.name);
      await expect(choice).toContainText('OWNER');
      await expect(choice).toContainText(`@${team.slug} • 1 members`);
    }
    await teamChoice(page, second.name).click();
    await expect(
      page.getByText(`Switched to team: ${second.name}`)
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/app/${second.slug}$`));
    await page.goto('/app');
    await expect(page).toHaveURL(new RegExp(`/app/${second.slug}$`));

    await teamSwitcher(page, second.name).click();
    await page.getByRole('menuitem', { name: first.name }).click();
    await expect(page).toHaveURL(new RegExp(`/app/${first.slug}$`));
    await page.goto('/app');
    await expect(page).toHaveURL(new RegExp(`/app/${first.slug}$`));

    await teamSwitcher(page, first.name).click();
    await page.getByRole('menuitem', { name: 'Add team' }).click();
    await expect(page).toHaveURL(/\/app\?step=2$/);
    await expect(createButton(page)).toBeVisible();

    await page
      .context()
      .addCookies([
        { name: 'last_team_slug', value: other.slug, url: BASE_URL }
      ]);
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app$/);
    await expect(teamChoice(page, first.name)).toBeVisible();
  });

  test(
    'the team picker shows the team list for an unknown step',
    knownBug(98),
    async ({ page, request, freshPersona }) => {
      const host = await freshPersona('host');
      const { team } = await seedApi(request).team({
        ns: host.ns,
        suffix: 'a',
        name: 'Team Alpha'
      });

      for (const step of ['0', 'create']) {
        await page.goto(`/app?step=${step}`);
        await expect(teamChoice(page, team.name)).toBeVisible();
      }
    }
  );
});
