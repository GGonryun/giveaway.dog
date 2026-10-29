import type { APIRequestContext, Page } from '@playwright/test';
import { freshNamespace } from '../fixtures/personas';
import { expect } from '../fixtures/test';
import { MAX_RELOADS } from './poll';
import { seedApi } from './seed';

export type ParticipantRow = {
  id: string;
  userId: string;
  email: string | null;
  prizeId: string | null;
  completions: number;
  formValues: { fieldId: string; value: string }[];
  referrals: { taskId: string; code: string; referred: number }[];
};

export type SweepstakesRow = {
  id: string;
  status: string;
  createdAt: string;
  details: { name: string };
  visibility: { visibility: string; slug: string | null };
  _count: { participants: number; tasks: number; prizes: number };
};

export const readParticipants = async (
  request: APIRequestContext,
  id: string
) =>
  (
    await seedApi(request).rows<{ participants: ParticipantRow[] }>({
      view: 'participants',
      id
    })
  ).participants;

export const readSweepstakes = async (request: APIRequestContext, id: string) =>
  (
    await seedApi(request).rows<{ sweepstakes: SweepstakesRow }>({
      view: 'sweepstakes',
      id
    })
  ).sweepstakes;

export const editPage = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/edit`;

export const previewPage = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/preview`;

export const openEditor = async (page: Page, team: string, id: string) => {
  await page.goto(editPage(team, id));
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
};

export const saveChanges = async (page: Page) => {
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Save Changes', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Save Changes?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirm' }).click();
};

export const expectSaved = async (page: Page) => {
  await expect(page.getByText('Sweepstakes updated successfully!')).toBeVisible(
    { timeout: 30_000 }
  );
};

export const removeEntryMethod = (page: Page, label: string) =>
  page.getByRole('button', { name: `Remove ${label}`, exact: true }).click();

export const freshGiveawayNamespace = (testInfo: { workerIndex: number }) => {
  const ns = freshNamespace(testInfo.workerIndex);
  return { ns, slug: `e2e-${ns}-page`, token: `[e2e ${ns}]` };
};

export const searchList = async (page: Page, text: string) => {
  const box = page.getByRole('textbox', {
    name: 'Search sweepstakes by title, prize, status...'
  });
  await expect(async () => {
    await box.fill(text);
    await expect
      .poll(() => new URL(page.url()).searchParams.get('search'), {
        timeout: 3_000
      })
      .toBe(text);
  }).toPass({ timeout: 30_000 });
};

export const openRowMenu = async (page: Page, team: string, name: string) => {
  await page.goto(`/app/${team}`);
  await searchList(page, name);
  await page
    .getByRole('row')
    .filter({ hasText: name })
    .getByRole('button', { name: 'Giveaway actions' })
    .click();
  return page.getByRole('menu');
};

export const expectNotFoundAfterReloads = async (page: Page, path: string) => {
  const statuses: number[] = [];
  for (let reloads = 0; reloads <= MAX_RELOADS; reloads++) {
    statuses.push((await page.goto(path))?.status() ?? 0);
    if (statuses.at(-1) === 404) return;
  }
  expect(
    statuses,
    `GET ${path} after ${MAX_RELOADS} reloads. Does the write expire the cache tags of the page?`
  ).toContain(404);
};
