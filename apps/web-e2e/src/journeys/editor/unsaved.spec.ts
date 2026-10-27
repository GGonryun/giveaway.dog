import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { headerButton, openStep } from '../../helpers/editor';
import { knownBug } from '../../helpers/known-bug';
import { openEditor, previewPage, readSweepstakes } from '../../helpers/manage';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BEFORE_UNLOAD_WAIT = 5_000;

const exitDialog = (page: Page) =>
  page.getByRole('dialog', { name: "You're exiting the Sweepstakes Editor" });

const changeName = (page: Page) =>
  page.getByRole('textbox', { name: 'Name' }).fill('Unsaved e2e name');

const CUSTOM_TERMS = 'Custom e2e terms';

const UNTRACKED_CHANGES: {
  title: string;
  issue: number;
  terms?: { type: 'CUSTOM'; text: string };
  change: (page: Page) => Promise<void>;
}[] = [
  {
    title: 'the terms type',
    issue: 592,
    change: (page) =>
      page.getByRole('button', { name: 'Custom', exact: true }).click()
  },
  {
    title: 'the custom terms text',
    issue: 592,
    terms: { type: 'CUSTOM', text: `<p>${CUSTOM_TERMS}</p>` },
    change: async (page) => {
      await page.getByRole('main').getByText(CUSTOM_TERMS).click();
      await page.keyboard.press('End');
      await page.keyboard.type(' changed');
    }
  },
  {
    title: 'the Reward Profile Completion switch',
    issue: 592,
    change: async (page) => {
      await openStep(page, 'Audience');
      await page
        .getByRole('switch', { name: 'Reward Profile Completion' })
        .click();
    }
  }
];

test.describe('leave the editor of a published giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  const seedPublished = async (
    request: Parameters<typeof seedWorkerTeam>[0],
    testInfo: Parameters<typeof seedWorkerTeam>[1],
    terms?: { type: 'CUSTOM'; text: string }
  ) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      terms
    });
    return { team: team.slug, giveaway };
  };

  test('Cancel without a change goes straight to the preview', async ({
    page,
    request
  }, testInfo) => {
    const { team, giveaway } = await seedPublished(request, testInfo);
    await openEditor(page, team, giveaway.id);

    await headerButton(page, 'Cancel').click();

    await expect(page).toHaveURL(
      new RegExp(`${previewPage(team, giveaway.id)}$`),
      { timeout: 30_000 }
    );
  });

  test('a host is asked before leaving with a changed name, and Discard keeps the saved name', async ({
    page,
    request
  }, testInfo) => {
    const { team, giveaway } = await seedPublished(request, testInfo);
    await openEditor(page, team, giveaway.id);
    await changeName(page);

    await headerButton(page, 'Cancel').click();
    const dialog = exitDialog(page);
    await expect(
      dialog.getByRole('button', { name: 'Continue Editing' })
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Continue Editing' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Unsaved e2e name'
    );

    await headerButton(page, 'Cancel').click();
    await dialog.getByRole('button', { name: 'Discard Changes' }).click();
    await expect(page).toHaveURL(
      new RegExp(`${previewPage(team, giveaway.id)}$`),
      { timeout: 30_000 }
    );
    expect(await readSweepstakes(request, giveaway.id)).toMatchObject({
      details: { name: giveaway.name }
    });
  });

  for (const { title, issue, terms, change } of UNTRACKED_CHANGES) {
    test(
      `a host is asked before leaving after changing only ${title}`,
      knownBug(issue),
      async ({ page, request }, testInfo) => {
        const { team, giveaway } = await seedPublished(
          request,
          testInfo,
          terms
        );
        await openEditor(page, team, giveaway.id);
        await change(page);

        await headerButton(page, 'Cancel').click();

        await expect(exitDialog(page)).toBeVisible();
      }
    );
  }

  test('discarding the terms sheet keeps the other unsaved changes', async ({
    page,
    request
  }, testInfo) => {
    const { team, giveaway } = await seedPublished(request, testInfo);
    await openEditor(page, team, giveaway.id);
    await changeName(page);

    await page.getByRole('button', { name: 'Modify' }).click();
    const terms = page.getByRole('dialog', {
      name: 'Customize Terms & Conditions'
    });
    await terms
      .getByRole('textbox', { name: 'Sponsor Name' })
      .fill('Discarded e2e sponsor');
    await page.keyboard.press('Escape');
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /Discard/ })
      .click();
    await expect(terms).toBeHidden();

    await headerButton(page, 'Cancel').click();
    await expect(exitDialog(page)).toBeVisible();
  });

  test(
    'a host is asked before a reload throws away unsaved changes',
    knownBug(593),
    async ({ page, request }, testInfo) => {
      const { team, giveaway } = await seedPublished(request, testInfo);
      await openEditor(page, team, giveaway.id);
      await changeName(page);

      const beforeUnload = page
        .waitForEvent('dialog', {
          predicate: (dialog) => dialog.type() === 'beforeunload',
          timeout: BEFORE_UNLOAD_WAIT
        })
        .then(
          async (dialog) => {
            await dialog.dismiss();
            return true;
          },
          () => false
        );
      await page.reload({ waitUntil: 'commit' }).catch(() => undefined);

      expect(await beforeUnload).toBe(true);
    }
  );
});
