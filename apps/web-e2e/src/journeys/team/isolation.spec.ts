import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { expectNotInPayload } from '../../helpers/leaks';
import { signInAs } from '../../helpers/personas';
import {
  captureServerAction,
  readActionResult,
  replaceInArgs,
  replayServerAction
} from '../../helpers/rsc';
import { seedApi, type SeededSweepstakes } from '../../helpers/seed';
import {
  captureCompleteAction,
  openAs,
  seedEndedWithWinner,
  seedOtherTeam,
  seedRolesTeam,
  sweepstakesStatus
} from '../../helpers/teams';

type DrawRows = { byResult: Record<string, number> };

const ABORTED_ACTION = /Failed to load resource: net::ERR_FAILED/;

const REFUSED = /^(FORBIDDEN|NOT_FOUND)$/;

const drawResults = async (
  request: APIRequestContext,
  giveaway: SeededSweepstakes
) =>
  (
    await seedApi(request).rows<DrawRows>({
      view: 'draws',
      id: giveaway.id
    })
  ).byResult;

const openWinnerAction = async (
  page: Page,
  action: 'Disqualify' | 'Re-roll'
) => {
  await page.getByRole('button', { name: 'Winner actions' }).click();
  await page.getByRole('menuitem', { name: action }).click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('textbox', { name: /Disqualification Reason/ })
    .fill('e2e cross-team check');
  return dialog;
};

test.describe('cross-team isolation', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ allowedPageErrors: [ABORTED_ACTION] });

  test("a host cannot read another team's entrants by putting its giveaway id under their own slug", async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const { team: other } = await seedOtherTeam(request, ns);
    const giveaway = await seedEndedWithWinner(
      request,
      ns,
      other.slug,
      'participant2'
    );
    const entrant = giveaway.entries[0];
    await signInAs(page.request, 'host', ns);

    for (const tab of [
      'participants',
      `participants/${entrant.userId}`,
      'entries',
      'winners',
      'analytics'
    ]) {
      await expectNotInPayload(
        page.request,
        `/app/${team.slug}/sweepstakes/${giveaway.id}/${tab}`,
        { "the other team's entrant email": entrant.email }
      );
    }
  });

  test(
    "the preview and promotion tabs do not show another team's giveaway",
    knownBug(441),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedRolesTeam(request, ns);
      const { team: other } = await seedOtherTeam(request, ns);
      const ended = await seedEndedWithWinner(
        request,
        ns,
        other.slug,
        'participant2'
      );
      const draft = await seedApi(request).sweepstakes({
        ns,
        team: other.slug,
        preset: 'draft'
      });
      await signInAs(page.request, 'host', ns);

      for (const tab of ['preview', 'promotion']) {
        await expectNotInPayload(
          page.request,
          `/app/${team.slug}/sweepstakes/${ended.id}/${tab}`,
          { "the other team's winner email": ended.entries[0].email }
        );
        await expectNotInPayload(
          page.request,
          `/app/${team.slug}/sweepstakes/${draft.id}/${tab}`,
          { "the other team's draft name": draft.name }
        );
      }
    }
  );

  test.describe('user profiles', () => {
    test.use({
      allowedPageErrors: [
        /User with ID \w+ not found|didn't match the client properties/
      ]
    });

    test('a host cannot open the profile of someone who never entered their team giveaways', async ({
      page,
      request
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedRolesTeam(request, ns);
      const { team: other } = await seedOtherTeam(request, ns);
      const giveaway = await seedEndedWithWinner(
        request,
        ns,
        other.slug,
        'participant2'
      );
      const entrant = giveaway.entries[0];
      const host2 = await signInAs(request, 'host2', ns);
      await signInAs(page.request, 'host', ns);

      for (const user of [
        { id: entrant.userId, email: entrant.email },
        { id: host2.id, email: host2.email }
      ]) {
        const url = `/app/${team.slug}/users/${user.id}/overview`;
        await expectNotInPayload(page.request, url, {
          'the email': user.email
        });

        await page.goto(url);
        await expect(page.getByText('Profile Information')).toHaveCount(0);
        await expect(page.getByText('Account Signals')).toHaveCount(0);
      }
    });
  });

  test("a host's Users list contains only people who entered the team giveaways", async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const { team: other } = await seedOtherTeam(request, ns);
    const own = await seedEndedWithWinner(
      request,
      ns,
      team.slug,
      'participant'
    );
    const foreign = await seedEndedWithWinner(
      request,
      ns,
      other.slug,
      'participant2'
    );
    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/users`);

    const search = async (term: string) => {
      await page
        .getByRole('textbox', { name: 'Search by name, email, or ID...' })
        .fill(term);
      await page.getByRole('button', { name: 'Search', exact: true }).click();
    };
    const rows = page.getByRole('rowgroup').nth(1).getByRole('row');

    for (const term of [foreign.entries[0].email, foreign.entries[0].userId]) {
      await search(term);
      await expect(rows.filter({ hasText: 'E2E participant2' })).toHaveCount(0);
    }

    await search(own.entries[0].email);
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText('E2E participant');
  });

  test(
    "a user's Entries tab lists only the entries of the current team",
    knownBug(437),
    async ({ page, request }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedRolesTeam(request, ns);
      const { team: shared } = await seedApi(request).team({
        ns,
        suffix: 'c',
        owner: 'host2',
        members: [{ persona: 'host', role: 'MEMBER' }]
      });
      await seedEndedWithWinner(request, ns, team.slug, 'participant2');
      const giveaway = await seedEndedWithWinner(
        request,
        ns,
        shared.slug,
        'participant2'
      );
      await signInAs(page.request, 'host', ns);

      await expectNotInPayload(
        page.request,
        `/app/${team.slug}/users/${giveaway.entries[0].userId}/entries`,
        { "the other team's giveaway id": giveaway.id }
      );
    }
  );

  test.describe('X pickers', () => {
    test.use({
      allowedPageErrors: [
        /Failed to (draw winners|delete picker): TypeError: Failed to fetch|Failed to load resource: net::ERR_FAILED/
      ]
    });

    test("a host cannot draw or delete another team's X picker", async ({
      page,
      request,
      browser
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const seed = seedApi(request);
      const { team } = await seedRolesTeam(request, ns);
      const { team: other } = await seedOtherTeam(request, ns);
      const users = [{ username: `own_${ns}` }, { username: `own2_${ns}` }];
      const own = await seed.picker({
        team: team.slug,
        users,
        draws: [{ user: 0 }]
      });
      const foreign = await seed.picker({
        team: other.slug,
        users: [{ username: `oth_${ns}` }, { username: `oth2_${ns}` }],
        draws: [{ user: 0 }]
      });
      await signInAs(page.request, 'host', ns);

      await page.goto(`/app/${team.slug}/pickers/x/${own.id}`);
      const draw = await captureServerAction(
        page,
        async () => {
          await page.getByRole('button', { name: 'Draw Extra' }).click();
          await page.getByRole('button', { name: 'Confirm Draw' }).click();
        },
        { abort: true }
      );
      await page.keyboard.press('Escape');
      const remove = await captureServerAction(
        page,
        async () => {
          await page.getByRole('button', { name: 'Picker actions' }).click();
          await page.getByRole('menuitem', { name: 'Delete Picker' }).click();
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Delete Picker' })
            .click();
        },
        { abort: true }
      );

      for (const action of [draw, remove]) {
        const response = await replayServerAction(
          page,
          action,
          replaceInArgs(action.args, { [own.id]: foreign.id })
        );
        expect(readActionResult(response)).toMatchObject({ ok: false });
      }

      await expectNotInPayload(
        page.request,
        `/app/${team.slug}/pickers/x/${foreign.id}`,
        { "the other team's picker user": `oth_${ns}` }
      );

      const owner = await openAs(browser, 'host2', ns);
      await owner.page.goto(`/app/${other.slug}/pickers/x/${foreign.id}`);
      await expect(owner.page.getByText('Winners (1)')).toBeVisible();
      await owner.context.close();
    });
  });

  test("a host cannot disqualify or re-roll another team's prize winner", async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const { team: other } = await seedOtherTeam(request, ns);
    const own = await seedEndedWithWinner(
      request,
      ns,
      team.slug,
      'participant'
    );
    const foreign = await seedEndedWithWinner(
      request,
      ns,
      other.slug,
      'participant2'
    );
    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/sweepstakes/${own.id}/winners`);

    const disqualify = await captureServerAction(
      page,
      async () =>
        (await openWinnerAction(page, 'Disqualify'))
          .getByRole('button', { name: 'Disqualify', exact: true })
          .click(),
      { abort: true }
    );
    await page.keyboard.press('Escape');
    const reroll = await captureServerAction(
      page,
      async () =>
        (await openWinnerAction(page, 'Re-roll'))
          .getByRole('button', { name: 'Disqualify & Re-roll' })
          .click(),
      { abort: true }
    );

    const disqualified = await replayServerAction(
      page,
      disqualify,
      replaceInArgs(disqualify.args, {
        [own.id]: foreign.id,
        [own.draws[0].id]: foreign.draws[0].id
      })
    );
    expect(readActionResult(disqualified)).toMatchObject({ ok: false });

    const rerolled = await replayServerAction(
      page,
      reroll,
      replaceInArgs(reroll.args, { [own.draws[0].id]: foreign.draws[0].id })
    );
    expect(readActionResult(rerolled)).toMatchObject({ ok: false });

    expect(await drawResults(request, foreign)).toEqual({ WINNER: 1 });
    expect(await drawResults(request, own)).toEqual({ WINNER: 1 });
  });

  test('a visitor or a non-member cannot run a host procedure', async ({
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

    const visitor = await openAs(browser, null, ns);
    await visitor.page.goto('/');
    const anonymous = await replayServerAction(visitor.page, complete);
    expect(anonymous.text).not.toContain('"ok":true');
    await visitor.context.close();

    const host2 = await openAs(browser, 'host2', ns);
    await host2.page.goto('/app');
    const result = readActionResult(
      await replayServerAction(host2.page, complete)
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.data.code).toMatch(REFUSED);
    await host2.context.close();

    expect(await sweepstakesStatus(request, giveaway)).toBe('ACTIVE');
  });
});
