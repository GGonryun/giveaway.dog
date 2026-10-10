import { expect, test } from '../fixtures/test';
import { knownBug } from '../helpers/known-bug';
import {
  NOT_FOUND_PAGES,
  PUBLIC_PAGES,
  expectNoErrorMarkers
} from '../helpers/public-pages';

// The middleware treats every path that starts with /app as the dashboard.
const KNOWN_BUGS: Record<string, number> = { '/apps': 360 };

test.describe('public pages', { tag: '@smoke' }, () => {
  for (const { path, text } of PUBLIC_PAGES) {
    const details = KNOWN_BUGS[path] ? knownBug(KNOWN_BUGS[path]) : {};

    test(`a visitor loads ${path}`, details, async ({ page, request }) => {
      const response = await request.get(path);
      expect(response.status(), `GET ${path} ends at ${response.url()}`).toBe(
        200
      );
      expect(new URL(response.url()).pathname).toBe(path.split('?')[0]);
      await expectNoErrorMarkers(response);

      await page.goto(path);

      if (path === '/pricing') {
        await expect(page).toHaveURL(/\/home#pricing$/);
      }
      await expect(
        text ? page.getByText(text) : page.getByRole('heading').first()
      ).toBeVisible();
    });
  }

  test.describe('unknown pages', () => {
    // Chromium logs the 404 of the document, and next dev replays the server
    // log of the picker procedure. One pattern: Playwright reads an array of
    // two as a value and its options.
    test.use({
      allowedPageErrors: [
        /status of 404 \(Not Found\)|NOT_FOUND: Picker not found/
      ]
    });

    for (const path of NOT_FOUND_PAGES) {
      test(`${path} returns 404 with links home`, async ({ page, request }) => {
        const response = await request.get(path);
        expect(response.status()).toBe(404);
        expect(await response.text()).toContain('Content not found');

        await page.goto(path);

        await expect(
          page.getByRole('heading', { name: 'Content not found' })
        ).toBeVisible();
        await expect(
          page.getByRole('link', { name: 'Go home' })
        ).toHaveAttribute('href', '/');
        await expect(
          page.getByRole('link', { name: 'Giveaways' }).last()
        ).toHaveAttribute('href', '/browse');
      });
    }
  });
});
