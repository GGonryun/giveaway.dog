import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { signInAs } from '../../helpers/personas';
import {
  captureServerAction,
  readActionResult,
  replayServerAction
} from '../../helpers/rsc';
import { seedApi } from '../../helpers/seed';
import { openAs, seedRolesTeam } from '../../helpers/teams';

const deleteTemplate = async (page: Page, name: string) => {
  await page.getByRole('button', { name: 'Template actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill(name);
  await dialog.getByRole('button', { name: 'Delete Template' }).click();
};

test.describe('team templates', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({
    allowedPageErrors: [
      /Required permission|Failed to fetch|Failed to load resource: net::ERR_FAILED/
    ]
  });

  test('[ROLE-001] a guest or a blocked member cannot delete a template of the team', async ({
    page,
    request,
    browser
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedRolesTeam(request, ns);
    const name = `Template ${ns}`;
    const {
      templates: [template]
    } = await seedApi(request).templates({
      team: team.slug,
      templates: [{ name }]
    });
    await signInAs(page.request, 'host', ns);
    await page.goto(`/app/${team.slug}/templates`);
    const remove = await captureServerAction(
      page,
      () => deleteTemplate(page, name),
      { abort: true }
    );

    const guest = await openAs(browser, 'guest', ns);
    await guest.page.goto(`/app/${team.slug}/templates`);
    await deleteTemplate(guest.page, name);
    await expect(
      guest.page.getByText(
        /Failed to delete template: .*Required permission: UPDATE_SWEEPSTAKES/
      )
    ).toBeVisible();
    await guest.context.close();

    const blocked = await openAs(browser, 'blocked', ns);
    await blocked.page.goto('/app?step=1');
    expect(
      readActionResult(await replayServerAction(blocked.page, remove))
    ).toMatchObject({ ok: false, data: { code: 'FORBIDDEN' } });
    await blocked.context.close();

    expect(await seedApi(request).templateRows(team.slug)).toEqual([
      expect.objectContaining({ id: template.id, name })
    ]);
  });
});
