import type { APIRequestContext, APIResponse } from '@playwright/test';
import { toE2ePersonaEmail } from '@giveaway/e2e-model/personas';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { BASE_URL, E2E_SECRET } from '../../env';
import { noRedirect } from '../../helpers/http';
import { signInAs } from '../../helpers/personas';
import { seedApi } from '../../helpers/seed';
import { openAs, seedOtherTeam, seedRolesTeam } from '../../helpers/teams';

type Hop = { url: string; status: number; location?: string; body: string };

const MAX_HOPS = 5;

const followRedirects = async (request: APIRequestContext, start: string) => {
  const hops: Hop[] = [];
  let url: string | undefined = start;
  while (url && hops.length < MAX_HOPS) {
    const response: APIResponse = await request.get(url, noRedirect);
    const location: string | undefined = response.headers().location;
    hops.push({
      url,
      status: response.status(),
      location,
      body: await response.text()
    });
    url = location && new URL(location, BASE_URL).toString();
  }
  return hops;
};

const finalPath = (hops: Hop[]) => {
  const { pathname, search } = new URL(hops[hops.length - 1].url, BASE_URL);
  return `${pathname}${search}`;
};

const expectNoLeak = (hops: Hop[], secrets: Record<string, string>) => {
  for (const hop of hops) {
    for (const [name, value] of Object.entries(secrets)) {
      expect(
        hop.body.includes(value),
        `The response of ${hop.url} contains ${name}`
      ).toBe(false);
    }
  }
};

test.describe('team page access', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('a non-member, a participant and a visitor cannot open the pages of a team, and learn nothing from the response', async ({
    request,
    playwright
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const giveaway = await seedApi(request).sweepstakes({
      ns,
      team: team.slug,
      entries: [{ persona: 'participant' }]
    });
    const entrant = giveaway.entries[0];
    const secrets = {
      'the team name': team.name,
      "the entrant's email": toE2ePersonaEmail('participant', ns)
    };
    const pages = [
      `/app/${team.slug}`,
      `/app/${team.slug}/settings/team`,
      `/app/${team.slug}/users`,
      `/app/${team.slug}/settings/integrations`,
      `/app/${team.slug}/users/${entrant.userId}/overview`,
      '/app/no-such-team-x'
    ];

    const signedIn = async (persona: 'host2' | 'participant2' | null) => {
      const context = await playwright.request.newContext({
        baseURL: BASE_URL,
        storageState: await request.storageState()
      });
      if (persona) await signInAs(context, persona, ns);
      return context;
    };

    const host2 = await signedIn('host2');
    for (const path of pages) {
      const hops = await followRedirects(host2, path);
      expect(hops[0].status, path).toBe(307);
      expect(finalPath(hops), path).toBe('/app');
      expectNoLeak(hops, secrets);
    }
    await host2.dispose();

    const participant = await signedIn('participant2');
    for (const path of pages) {
      const hops = await followRedirects(participant, path);
      expect(finalPath(hops), path).toBe('/browse');
      expectNoLeak(hops, secrets);
    }
    await participant.dispose();

    const visitor = await signedIn(null);
    for (const path of pages) {
      const hops = await followRedirects(visitor, path);
      expect(finalPath(hops), path).toBe(
        `/login?${new URLSearchParams({ callbackUrl: new URL(path, BASE_URL).toString() })}`
      );
      expectNoLeak(hops, secrets);
    }
    await visitor.dispose();
  });

  test.describe('blocked member', () => {
    test.use({ allowedPageErrors: [/ClientFetchError|is blocked from team/] });

    test('a blocked member is locked out of the team', async ({
      page,
      request,
      browser
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const seed = seedApi(request);
      const { team } = await seedRolesTeam(request, ns);
      const { team: other } = await seedOtherTeam(request, ns);
      const { link } = await seed.invites({ ns, team: team.slug, link: {} });
      await signInAs(page.request, 'blocked', ns);

      await page.goto('/app?step=1');
      await expect(page.getByText('Choose Your Team')).toBeVisible();
      await expect(
        page.getByRole('button', { name: other.name })
      ).toBeVisible();
      await expect(page.getByRole('button', { name: team.name })).toHaveCount(
        0
      );

      await page.goto(`/app/${other.slug}`);
      await page.getByRole('button', { name: other.name, exact: true }).click();
      await expect(page.getByRole('menu')).toBeVisible();
      await expect(page.getByRole('menu')).not.toContainText(team.name);
      await page.keyboard.press('Escape');

      await page
        .context()
        .addCookies([
          { name: 'last_team_slug', value: team.slug, url: BASE_URL }
        ]);
      await page.goto('/app');
      await expect(page).toHaveURL(/\/app$/);
      await expect(page.getByText('Choose Your Team')).toBeVisible();

      for (const path of [
        `/app/${team.slug}`,
        `/app/${team.slug}/settings/integrations`
      ]) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/app$/);
      }

      await page.goto(`/invites/${link!.id}`);
      await page.getByRole('button', { name: 'Accept Invitation' }).click();
      await expect(
        page.getByText('You are already a member of this team')
      ).toBeVisible();

      const owner = await openAs(browser, 'host', ns);
      await owner.page.goto(`/app/${team.slug}/settings/team`);
      await expect(
        owner.page.getByRole('row').filter({ hasText: 'E2E blocked' })
      ).toContainText('BLOCKED');
      await owner.context.close();
    });
  });
});
