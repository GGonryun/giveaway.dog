import type { Page } from '@playwright/test';

export const MAX_RELOADS = 2;

export const expectAfterReloads = async (
  page: Page,
  assertion: () => Promise<unknown>
) => {
  for (let reloads = 0; ; reloads++) {
    try {
      await assertion();
      return reloads;
    } catch (error) {
      if (reloads === MAX_RELOADS) {
        if (error instanceof Error) {
          error.message = `Still failing after ${MAX_RELOADS} reloads. Does the write expire the cache tags of the page?\n\n${error.message}`;
        }
        throw error;
      }
      await page.reload();
    }
  }
};
