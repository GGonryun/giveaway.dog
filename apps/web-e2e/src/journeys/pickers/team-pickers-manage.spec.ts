import type { Page } from '@playwright/test';
import { E2E_X_FIXTURES } from '@giveaway/e2e-model/fakes';
import { expect, test } from '../../fixtures/test';
import { freshNamespace } from '../../fixtures/personas';
import { E2E_SECRET } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { signInAs } from '../../helpers/personas';
import {
  createTeamPicker,
  pickerActions,
  pickerRow,
  publishDialog,
  publishFromHeader,
  seedPickerTeam,
  skipWithoutScrapeBadgerFixtures,
  teamPickerPostUrl
} from '../../helpers/pickers';
import { seedApi } from '../../helpers/seed';

const UNEXPECTED_URL =
  'Unexpected URL, should be like https://x.com/username/status/1234567890';

const postUrlInput = (page: Page) =>
  page.getByRole('textbox', { name: 'Post URL' });

const expectNotFound = async (page: Page, path: string) => {
  const response = await page.request.get(path);
  expect(response.status()).toBe(404);
};

test.describe('team X pickers, as their host', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to seed pickers');

  test.use({
    allowedPageErrors: [
      /ClientFetchError|Unable to load tweet preview|didn't match the client properties/
    ]
  });

  test('a host saves a draft picker and sees its settings after a reload', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);
    await signInAs(page.request, 'host', ns);
    const pickerId = await createTeamPicker(page, team.slug);

    for (const url of [
      `https://twitter.com/u/status/${E2E_X_FIXTURES.tweet}`,
      `https://x.com/u/status/${E2E_X_FIXTURES.tweet}?s=20`
    ]) {
      await postUrlInput(page).fill(url);
      await expect(page.getByText(UNEXPECTED_URL)).toBeVisible();
    }

    const postUrl = teamPickerPostUrl(E2E_X_FIXTURES.tweet);
    await postUrlInput(page).fill(postUrl);
    await expect(page.getByText(UNEXPECTED_URL)).toHaveCount(0);
    await page.getByRole('spinbutton', { name: 'Number of Winners' }).fill('3');
    await page
      .getByRole('spinbutton', { name: 'Minimum Followers' })
      .fill('50');
    await expect(page.getByRole('switch', { name: 'Last Post' })).toHaveCount(
      0
    );
    const bio = page.getByRole('switch', { name: 'Bio/Description' });
    if (!(await bio.isChecked())) await bio.click();

    await publishFromHeader(page);
    await publishDialog(page)
      .getByRole('button', { name: 'Save & Exit' })
      .click();
    await expect(page.getByText('Picker saved successfully!')).toBeVisible();
    await page.waitForURL(`**/app/${team.slug}/pickers/x`);

    await page.getByRole('tab', { name: 'Draft' }).click();
    await page.waitForURL(/status=DRAFT/);
    await pickerRow(page, pickerId).click();
    await page.waitForURL(`**/pickers/x/${pickerId}/edit`);
    await page.reload();

    await expect(postUrlInput(page)).toHaveValue(postUrl);
    await expect(
      page.getByRole('spinbutton', { name: 'Number of Winners' })
    ).toHaveValue('3');
    await expect(
      page.getByRole('spinbutton', { name: 'Minimum Followers' })
    ).toHaveValue('50');
    await expect(
      page.getByRole('switch', { name: 'Bio/Description' })
    ).toBeChecked();
  });

  test('a host discards a new draft picker', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);
    await signInAs(page.request, 'host', ns);
    const pickerId = await createTeamPicker(page, team.slug);

    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page
      .getByRole('dialog', { name: "You're exiting the Picker Editor" })
      .getByRole('button', { name: 'Delete Draft' })
      .click();
    await expect(page.getByText('Picker deleted successfully!')).toBeVisible();
    await page.waitForURL(`**/app/${team.slug}/pickers/x`);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'X Picker' })).toBeVisible();
    await expect(pickerRow(page, pickerId)).toHaveCount(0);
  });

  test('a host filters the picker list by status', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);
    const complete = await seedApi(request).picker({
      team: team.slug,
      status: 'COMPLETE'
    });
    const draft = await seedApi(request).picker({
      team: team.slug,
      status: 'DRAFT'
    });
    await signInAs(page.request, 'host', ns);

    await page.goto(`/app/${team.slug}/pickers/x`);
    await expect(pickerRow(page, complete.id)).toBeVisible();
    await expect(pickerRow(page, draft.id)).toBeVisible();

    await page.getByRole('tab', { name: 'Complete' }).click();
    await page.waitForURL(/status=COMPLETE/);
    await expect(pickerRow(page, complete.id)).toContainText('Complete');
    await expect(pickerRow(page, draft.id)).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('tab', { name: 'Complete' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(pickerRow(page, complete.id)).toBeVisible();
    await expect(pickerRow(page, draft.id)).toHaveCount(0);

    await page.getByRole('tab', { name: 'Failed' }).click();
    await page.waitForURL(/status=FAILED/);
    await expect(page.getByText('No pickers found')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create Your First Picker' })
    ).toBeVisible();
  });

  test('a host who opens the picker list with an unknown status sees every picker', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);
    const picker = await seedApi(request).picker({ team: team.slug });
    await signInAs(page.request, 'host', ns);

    await page.goto(`/app/${team.slug}/pickers/x?status=BOGUS`);
    await expect(page.getByRole('tab', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(pickerRow(page, picker.id)).toBeVisible();
    await expect(page.getByText(/Error loading pickers/)).toHaveCount(0);
  });

  test('a host deletes pickers that already have winners, from their page and from the list', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);
    const seedWithWinner = () =>
      seedApi(request).picker({
        team: team.slug,
        users: [{ username: `win_${ns}` }],
        draws: [{ user: 0 }]
      });
    const fromPage = await seedWithWinner();
    const fromList = await seedWithWinner();
    await signInAs(page.request, 'host', ns);

    await page.goto(`/app/${team.slug}/pickers/x/${fromPage.id}`);
    await expect(page.getByText('Winners (1)')).toBeVisible();
    await pickerActions(page).click();
    await page.getByRole('menuitem', { name: 'Delete Picker' }).click();
    await page
      .getByRole('dialog', { name: 'Delete Picker' })
      .getByRole('button', { name: 'Delete Picker' })
      .click();
    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}/pickers$`), {
      timeout: 10_000
    });

    await page.goto(`/app/${team.slug}/pickers/x`);
    const row = pickerRow(page, fromList.id);
    await row.getByRole('button').click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete Picker' });
    await dialog
      .getByRole('textbox', { name: `Type '${fromList.id}' to confirm` })
      .fill(fromList.id);
    await dialog.getByRole('button', { name: 'Delete Picker' }).click();
    await expect(page.getByText('Picker deleted')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'X Picker' })).toBeVisible();
    for (const id of [fromPage.id, fromList.id]) {
      await expect(pickerRow(page, id)).toHaveCount(0);
      await expectNotFound(page, `/pickers/x/${id}`);
    }
  });

  test('a host schedules a picker for later', async ({
    page,
    request
  }, testInfo) => {
    const ns = freshNamespace(testInfo.workerIndex);
    const { team } = await seedPickerTeam(request, ns);
    await signInAs(page.request, 'host', ns);
    const pickerId = await createTeamPicker(page, team.slug);

    await postUrlInput(page).fill(teamPickerPostUrl(E2E_X_FIXTURES.tweet));
    await page.getByRole('switch', { name: 'Schedule for Later' }).click();
    await expect(page.getByText('Run Date')).toBeVisible();

    await publishFromHeader(page);
    await publishDialog(page)
      .getByRole('button', { name: 'Publish', exact: true })
      .click();
    await expect(
      page.getByText('Picker published successfully!')
    ).toBeVisible();
    await page.waitForURL(`**/app/${team.slug}/pickers/x/${pickerId}`);
    await expect(async () => {
      await page.reload();
      await expect(page.getByText('Scheduled for Processing')).toBeVisible({
        timeout: 2_000
      });
    }).toPass({ timeout: 60_000, intervals: [2_000] });

    await page.goto(`/pickers/x/${pickerId}`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Upcoming Draw' })
    ).toBeVisible();
    await expect(page.getByText('Pending', { exact: true })).toBeVisible();
  });

  test.describe('on a FREE team', () => {
    test('a host sees the X picker upsell and the pickers that are coming soon', async ({
      page,
      request
    }, testInfo) => {
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedPickerTeam(request, ns, 'FREE');
      await signInAs(page.request, 'host', ns);

      await page.goto(`/app/${team.slug}/pickers`);
      const card = (title: string) =>
        page
          .getByRole('heading', { level: 2, name: title, exact: true })
          .locator('xpath=ancestor::*[@data-slot="card"][1]');
      await expect(card('X')).toContainText('Pro only');
      await expect(card('Discord')).toContainText('Coming Soon');
      await expect(card('Twitch')).toContainText('Coming Soon');

      await card('X').click();
      await page.waitForURL(`**/app/${team.slug}/pickers/x`);
      await expect(
        page.getByText(
          'Upgrade to Pro to access X Picker powered by Twitter 2.0 API'
        )
      ).toBeVisible();
    });

    test(
      'a keyboard user opens the X picker from the picker list',
      knownBug(108),
      async ({ page, request }, testInfo) => {
        const ns = freshNamespace(testInfo.workerIndex);
        const { team } = await seedPickerTeam(request, ns, 'FREE');
        await signInAs(page.request, 'host', ns);

        await page.goto(`/app/${team.slug}/pickers`);
        const card = page
          .getByRole('heading', { level: 2, name: 'X', exact: true })
          .locator('xpath=ancestor::*[@data-slot="card"][1]');
        await expect(card).toBeVisible();
        await page.waitForLoadState('networkidle');

        const focusesCard = () =>
          card.evaluate((element) => element.matches(':focus-within'));
        let reached = false;
        for (let step = 0; step < 40 && !reached; step++) {
          await page.keyboard.press('Tab');
          reached = await focusesCard();
        }
        expect(reached, 'Tab reaches the X picker card').toBe(true);
        await page.keyboard.press('Enter');
        await page.waitForURL(`**/app/${team.slug}/pickers/x`);
      }
    );
  });

  test.describe('on the ScrapeBadger fixtures', () => {
    skipWithoutScrapeBadgerFixtures();

    test('a host cannot erase a completed draw by editing and publishing it again', async ({
      page,
      request
    }, testInfo) => {
      test.slow();
      const ns = freshNamespace(testInfo.workerIndex);
      const { team } = await seedPickerTeam(request, ns);
      await signInAs(page.request, 'host', ns);
      const pickerId = await createTeamPicker(page, team.slug);

      await postUrlInput(page).fill(teamPickerPostUrl(E2E_X_FIXTURES.tweet));
      await page
        .getByRole('spinbutton', { name: 'Number of Winners' })
        .fill('1');
      for (const name of [
        'Minimum Post Count',
        'Account Age (Days)',
        'Minimum Followers',
        'Minimum Following'
      ]) {
        await page.getByRole('spinbutton', { name }).clear();
      }
      const profileImage = page.getByRole('switch', {
        name: 'Profile Image'
      });
      if (await profileImage.isChecked()) await profileImage.click();
      await publishFromHeader(page);
      await publishDialog(page)
        .getByRole('button', { name: 'Publish', exact: true })
        .click();
      await page.waitForURL(`**/app/${team.slug}/pickers/x/${pickerId}`);

      await expect(async () => {
        await page.reload();
        await expect(page.getByText('Ready to Draw Winners')).toBeVisible({
          timeout: 2_000
        });
      }).toPass({ timeout: 60_000, intervals: [2_000] });
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: 'Draw Winners' }).click();
      const winners = page.getByText('Winners (1)');
      await expect(winners).toBeVisible({ timeout: 15_000 });

      await pickerActions(page).click();
      await expect(
        page.getByRole('menuitem', { name: 'Delete Picker' })
      ).toBeVisible();
      await expect(
        page.getByRole('menuitem', { name: 'Edit Picker' })
      ).toHaveCount(0);
      await page.keyboard.press('Escape');

      await page.goto(`/app/${team.slug}/pickers/x/${pickerId}/edit`);
      await expect(
        page.getByText('This picker can no longer be edited')
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Save Changes' })
      ).toHaveCount(0);

      await page.goto(`/app/${team.slug}/pickers/x/${pickerId}`);
      await expect(winners).toBeVisible();
    });
  });
});
