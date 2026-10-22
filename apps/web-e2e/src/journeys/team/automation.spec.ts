import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { expectNotInPayload } from '../../helpers/leaks';
import { signInAs } from '../../helpers/personas';
import {
  captureServerAction,
  readActionResult,
  replayServerAction
} from '../../helpers/rsc';
import { seedApi } from '../../helpers/seed';
import { openAs, seedOtherTeam, seedRolesTeam } from '../../helpers/teams';

const REFUSED_IN_UI =
  /Required permission|Failed to fetch|Failed to load resource: net::ERR_FAILED/;

const seedScheduledGiveaway = async (
  request: APIRequestContext,
  ns: string,
  team: string
) => {
  await seedApi(request).integrations({
    team,
    integrations: [{ provider: 'BLUESKY' }]
  });
  return seedApi(request).sweepstakes({
    ns,
    team,
    preset: 'scheduled'
  });
};

const promotionTab = (slug: string, id: string) =>
  `/app/${slug}/sweepstakes/${id}/promotion`;

const schedulePost = async (page: Page) => {
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Post to Bluesky' }).click();
  await page.getByRole('button', { name: 'Schedule Post' }).click();
};

const cancelPost = async (page: Page) => {
  await page.getByRole('button', { name: 'Cancel post' }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Cancel Post' })
    .click();
};

const postsOf = async (request: APIRequestContext, id: string) =>
  (await seedApi(request).jobs(id)).jobs.posts;

test.describe('team automated posts', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ allowedPageErrors: [REFUSED_IN_UI] });

  test('[ROLE-001] a guest or a blocked member cannot schedule a post', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const giveaway = await seedScheduledGiveaway(request, ns, team.slug);
    const url = promotionTab(team.slug, giveaway.id);
    await signInAs(page.request, 'host', ns);
    await page.goto(url);
    const schedule = await captureServerAction(page, () => schedulePost(page), {
      abort: true
    });

    const guest = await openAs(browser, 'guest', ns);
    await guest.page.goto(url);
    await schedulePost(guest.page);
    await expect(
      guest.page.getByText(/Required permission: UPDATE_SWEEPSTAKES/)
    ).toBeVisible();
    await guest.context.close();

    const blocked = await openAs(browser, 'blocked', ns);
    await blocked.page.goto('/app?step=1');
    expect(
      readActionResult(await replayServerAction(blocked.page, schedule))
    ).toMatchObject({ ok: false, data: { code: 'FORBIDDEN' } });
    await blocked.context.close();

    expect(await postsOf(request, giveaway.id)).toEqual([]);
  });

  test('[ROLE-001] a guest or a blocked member cannot cancel a scheduled post', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const giveaway = await seedScheduledGiveaway(request, ns, team.slug);
    const {
      posts: [post]
    } = await seedApi(request).automatedPosts({
      sweepstakesId: giveaway.id,
      posts: [{ type: 'POST_TO_BLUESKY' }]
    });
    const url = promotionTab(team.slug, giveaway.id);
    await signInAs(page.request, 'host', ns);
    await page.goto(url);
    const cancel = await captureServerAction(page, () => cancelPost(page), {
      abort: true
    });

    const guest = await openAs(browser, 'guest', ns);
    await guest.page.goto(url);
    await cancelPost(guest.page);
    await expect(
      guest.page.getByText(/Required permission: UPDATE_SWEEPSTAKES/)
    ).toBeVisible();
    await guest.context.close();

    const blocked = await openAs(browser, 'blocked', ns);
    await blocked.page.goto('/app?step=1');
    expect(
      readActionResult(await replayServerAction(blocked.page, cancel))
    ).toMatchObject({ ok: false, data: { code: 'FORBIDDEN' } });
    await blocked.context.close();

    expect(await postsOf(request, giveaway.id)).toEqual([
      expect.objectContaining({ id: post.id, status: 'PENDING' })
    ]);
  });

  test("[TEAM-002] the promotion tab does not show the scheduled post of another team's giveaway", async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const { team: other } = await seedOtherTeam(request, ns);
    const giveaway = await seedScheduledGiveaway(request, ns, other.slug);
    const text = `[e2e] The secret post of ${ns}`;
    await seedApi(request).automatedPosts({
      sweepstakesId: giveaway.id,
      posts: [{ type: 'POST_TO_BLUESKY', text }]
    });
    await signInAs(page.request, 'host', ns);

    await expectNotInPayload(
      page.request,
      promotionTab(team.slug, giveaway.id),
      {
        "the other team's scheduled post": text
      }
    );

    const owner = await openAs(browser, 'host2', ns);
    await owner.page.goto(promotionTab(other.slug, giveaway.id));
    await owner.page.getByRole('button', { name: 'View details' }).click();
    await expect(owner.page.getByRole('dialog')).toContainText(text);
    await owner.context.close();
  });
});
