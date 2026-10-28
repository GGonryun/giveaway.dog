import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { createDraft, headerButton, publishNow } from '../../helpers/editor';
import { editPage, readSweepstakes } from '../../helpers/manage';
import { expectAfterReloads } from '../../helpers/poll';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

test.describe('the paths of a draft in the editor', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('a stale editor tab cannot unpublish a giveaway', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const draft = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      preset: 'draft',
      startsIn: -60
    });
    const editor = `/app/${team.slug}/sweepstakes/${draft.id}/create`;
    await page.goto(editor);
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
      draft.name
    );

    const other = await page.context().newPage();
    await other.goto(editor);
    await publishNow(other, team.slug, /go live/);
    await other.close();
    expect(await readSweepstakes(request, draft.id)).toMatchObject({
      status: 'ACTIVE'
    });

    await headerButton(page, 'Cancel').click();
    await page.getByRole('button', { name: 'Save & Exit' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
      timeout: 30_000
    });
    expect(await readSweepstakes(request, draft.id)).toMatchObject({
      status: 'ACTIVE'
    });
  });

  test('"Create" then browser Back keeps the new draft on the dashboard', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const id = await createDraft(page, team.slug);

    await page.goBack();

    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`));
    expect(await readSweepstakes(request, id)).toMatchObject({
      status: 'DRAFT'
    });
    await expectAfterReloads(page, () =>
      expect
        .poll(() =>
          page
            .getByRole('link', { name: 'Untitled Sweepstakes' })
            .evaluateAll((links) =>
              links.map((link) => link.getAttribute('href'))
            )
        )
        .toContainEqual(expect.stringContaining(`/sweepstakes/${id}/create`))
    );
  });

  test('the /edit path of a draft opens /create', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const draft = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      preset: 'draft'
    });
    await page.goto(editPage(team.slug, draft.id));

    await expect(page).toHaveURL(
      new RegExp(`/app/${team.slug}/sweepstakes/${draft.id}/create$`)
    );
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
      draft.name
    );
    expect(await readSweepstakes(request, draft.id)).toMatchObject({
      status: 'DRAFT'
    });
  });
});
