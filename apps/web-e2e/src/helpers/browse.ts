import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { seedApi } from './seed';

export const HOUR = 60 * 60;

export const DAY = 24 * HOUR;

export const requirePublicSeeds = async (request: APIRequestContext) => {
  const health = await seedApi(request).health();
  test.skip(
    !health?.allowPublic,
    'Set E2E_ALLOW_PUBLIC=1 on the deployment to seed PUBLIC giveaways'
  );
};

export const giveawayCards = (page: Page) =>
  page
    .getByRole('main')
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { level: 3 }) });

export const giveawayCard = (page: Page, name: string) =>
  giveawayCards(page).filter({
    has: page.getByRole('heading', { level: 3, name, exact: true })
  });

export const cardLabels = async (page: Page, token: string) => {
  const names = await giveawayCards(page)
    .getByRole('heading', { level: 3 })
    .allTextContents();
  return names
    .map((name) => name.match(new RegExp(`${token} (\\w+)$`))?.[1])
    .filter((label) => label !== undefined);
};

export const noGiveaways = (page: Page) =>
  page.getByRole('heading', { name: 'No giveaways found' });

export const filtersSheet = (page: Page) =>
  page.getByRole('dialog', { name: 'Filter Giveaways' });

export const openFilters = async (page: Page) => {
  await page.getByRole('button', { name: 'Filters' }).click();
  await expect(filtersSheet(page)).toBeVisible();
  return filtersSheet(page);
};

export const hostOptions = async (page: Page) => {
  const sheet = await openFilters(page);
  const hosts = sheet.getByRole('button', { name: 'Hosts' });
  let options: string[] = [];
  if (await hosts.isVisible()) {
    await hosts.click();
    options = await page.getByRole('option').allTextContents();
    await page.getByRole('option', { name: 'Close', exact: true }).click();
  }
  await sheet.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(sheet).toBeHidden();
  return options;
};
