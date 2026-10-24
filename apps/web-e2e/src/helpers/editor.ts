import type { Browser, Locator, Page } from '@playwright/test';
import { BYPASS_STATE, RUN_ID } from '../env';
import { blockThirdParties } from './third-party';
import { expect } from '../fixtures/test';
import { STUB_BLOB_URL, stubBlobUploads } from './blob';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

export const EDITOR_STEPS = [
  'Setup',
  'Audience',
  'Tasks',
  'Selection',
  'Prizes',
  'Design'
] as const;

export type EditorStep = (typeof EDITOR_STEPS)[number];

export const editorTab = (page: Page, step: EditorStep) =>
  page
    .getByRole('tablist')
    .first()
    .getByRole('tab', { name: new RegExp(`^${step}( \\d+)?$`) });

export const openStep = (page: Page, step: EditorStep) =>
  editorTab(page, step).click();

export const clickUntilUrl = (page: Page, target: Locator, url: RegExp) =>
  expect(async () => {
    if (!url.test(page.url())) await target.click({ timeout: 5_000 });
    await expect(page).toHaveURL(url, { timeout: 10_000 });
  }).toPass({ timeout: 45_000 });

export const createDraft = async (page: Page, team: string) => {
  await page.goto(`/app/${team}`);
  await clickUntilUrl(
    page,
    page.getByRole('button', { name: 'Create', exact: true }),
    new RegExp(`/app/${team}/sweepstakes/[A-Za-z0-9_-]{6}/create$`)
  );
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
  return new URL(page.url()).pathname.split('/')[4];
};

export const uploadBanner = async (page: Page) => {
  const uploads = await stubBlobUploads(page);
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('Drag and drop files here').click();
  await (
    await chooser
  ).setFiles({ name: 'banner.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByRole('button', { name: 'Remove file' })).toBeVisible();
  await expect.poll(() => uploads.length).toBe(1);
  return STUB_BLOB_URL;
};

type CalendarDay = { month: string; day: string };

const calendarDay = (page: Page, daysFromToday: number): Promise<CalendarDay> =>
  page.evaluate((days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const text = (options: Intl.DateTimeFormatOptions) =>
      date.toLocaleDateString('en-US', options);
    return {
      month: text({ month: 'long', year: 'numeric' }),
      day: `${text({ weekday: 'long' })}, ${text({ month: 'long' })} ${date.getDate()}`
    };
  }, daysFromToday);

export const pickDate = async (
  page: Page,
  field: 'Start Date' | 'End Date',
  daysFromToday: number
) => {
  const { month, day } = await calendarDay(page, daysFromToday);
  await page.getByRole('button', { name: field, exact: true }).click();
  const calendar = page.getByRole('dialog').filter({
    has: page.getByRole('grid')
  });
  const next = calendar.getByRole('button', { name: 'Go to the Next Month' });
  await expect(calendar.getByRole('grid')).toBeVisible();
  while (!(await calendar.getByRole('grid', { name: month }).isVisible())) {
    await next.click();
  }
  const year = month.split(' ')[1];
  await calendar
    .getByRole('button', {
      name: new RegExp(`${day}(st|nd|rd|th), ${year}`)
    })
    .click();
  await page.keyboard.press('Escape');
  await expect(calendar).toBeHidden();
};

export const setTiming = async (
  page: Page,
  { startsIn, endsIn }: { startsIn: number; endsIn: number }
) => {
  await pickDate(page, 'Start Date', startsIn);
  await pickDate(page, 'End Date', endsIn);
};

export const addTask = async (page: Page, label: string) => {
  await page.getByRole('button', { name: 'Add Entry Method' }).click();
  const dialog = page.getByRole('dialog', { name: 'Entry Methods' });
  await dialog.getByText(label, { exact: true }).click();
  await expect(dialog).toBeHidden();
};

export const addPrize = (page: Page) =>
  page.getByRole('button', { name: 'Add New Prize' }).click();

export const fillComplete = async (
  page: Page,
  {
    name,
    startsIn = 0,
    endsIn = 10
  }: { name: string; startsIn?: number; endsIn?: number }
) => {
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await uploadBanner(page);
  await setTiming(page, { startsIn, endsIn });
  await openStep(page, 'Tasks');
  await addTask(page, 'Bonus');
  await openStep(page, 'Prizes');
  await addPrize(page);
};

export const publishDialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Ready to Publish?' });

export const issuesDialog = (page: Page) =>
  page.getByRole('dialog', { name: 'There are some problems' });

export const headerButton = (page: Page, name: 'Cancel' | 'Publish') =>
  page.getByRole('main').getByRole('button', { name, exact: true }).first();

export const giveawayName = (
  testInfo: { parallelIndex: number },
  label: string
) =>
  `[e2e ${RUN_ID}] ${label} w${testInfo.parallelIndex} ${Date.now() % 100_000}`;

export const publishNow = async (page: Page, team: string, golive: RegExp) => {
  await headerButton(page, 'Publish').click();
  const dialog = publishDialog(page);
  await expect(dialog).toContainText(golive);
  await dialog.getByRole('button', { name: 'Publish Now' }).click();
  await expect(
    page.getByText('Sweepstakes published successfully!')
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/app/${team}$`), {
    timeout: 30_000
  });
};

export const dashboardRow = (page: Page, name: string) =>
  page.getByRole('row').filter({ hasText: name });

export const searchDashboard = async (page: Page, name: string) => {
  await page
    .getByRole('textbox', {
      name: 'Search sweepstakes by title, prize, status...'
    })
    .fill(name);
  await expect(page).toHaveURL(/[?&]search=/);
};

export const openAsVisitor = async (browser: Browser, path: string) => {
  const context = await browser.newContext({ storageState: BYPASS_STATE });
  await blockThirdParties(context);
  const page = await context.newPage();
  await page.goto(path);
  return { context, page };
};
