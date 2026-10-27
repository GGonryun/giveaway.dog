import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';
import {
  createDraft,
  headerButton,
  issuesDialog,
  pickDate,
  publishDialog,
  setTiming
} from '../../helpers/editor';
import { seedWorkerTeam } from '../../helpers/seed';

const END_DATE_ISSUE = 'timing.endDate';

const endDateField = (page: Page) =>
  page.getByRole('button', { name: 'End Date', exact: true });

const expectEndDateIssue = async (page: Page, message: string) => {
  await expect(endDateField(page)).toHaveAccessibleDescription(message);
  await headerButton(page, 'Publish').click();
  const dialog = issuesDialog(page);
  await expect(
    dialog.getByRole('button', { name: `${END_DATE_ISSUE} ${message}` })
  ).toBeVisible();
  await expect(publishDialog(page)).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
};

test.describe('the timing of a giveaway in the editor', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host'), timezoneId: 'UTC' });

  test('a host cannot save an end date before the start date', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    await createDraft(page, team.slug);

    await setTiming(page, { startsIn: 5, endsIn: 3 });
    await expectEndDateIssue(page, 'End date must be after start date');
  });

  test('a host cannot save a giveaway that runs over 90 days', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    await createDraft(page, team.slug);

    await setTiming(page, { startsIn: 0, endsIn: 95 });
    await expectEndDateIssue(page, 'Duration cannot exceed 90 days');
  });

  test('a host cannot save an end date in the past', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    await createDraft(page, team.slug);

    await setTiming(page, { startsIn: -3, endsIn: -2 });
    await expectEndDateIssue(page, 'End date must be in the future');
  });

  test('changing the start date checks the end date again', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    await createDraft(page, team.slug);

    await setTiming(page, { startsIn: 0, endsIn: 5 });
    await expect(endDateField(page)).toHaveAttribute('aria-invalid', 'false');
    await pickDate(page, 'Start Date', 7);
    await expectEndDateIssue(page, 'End date must be after start date');
  });
});
