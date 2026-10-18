import type { APIRequestContext, BrowserContext } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BASE_URL, E2E_SECRET, personaState } from '../../env';
import { findErrorMarkers } from '../../helpers/public-pages';

const MAX_LINKS = 80;

const START_PAGES = [
  '/',
  '/home',
  '/learn/integrations',
  '/learn/templates',
  '/pickers/x',
  '/winners',
  '/history',
  '/contact',
  '/user/verify',
  '/does-not-exist'
];

// The only links that may redirect to another path. /pricing redirects in
// the browser, so its response is the page itself.
const VISITOR_REDIRECTS: Record<string, string> = {
  '/app': '/login',
  '/account': '/login'
};

// A signed-in host lands on the team picker.
const HOST_REDIRECTS: Record<string, string> = {
  '/': '/app',
  '/login': '/app'
};

// A direct load of a template returns 404 (#362). templates.spec.ts covers it.
const isSkipped = (path: string) => path.startsWith('/learn/templates/');

const ORIGIN = new URL(BASE_URL).origin;

// Each start page opens in its own tab. Auth.js fetches the session again
// when a page leaves, and the navigation aborts that fetch with a
// ClientFetchError. Closing the tab does not.
const collectLinks = async (context: BrowserContext, path: string) => {
  const page = await context.newPage();
  await page.goto(path, { waitUntil: 'networkidle' });
  const hrefs = await page
    .locator('a[href]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
  await page.close();

  return hrefs.flatMap((href) => {
    if (href.startsWith('#') || /^[a-z]+:/i.test(href.replace(ORIGIN, ''))) {
      return [];
    }
    const url = new URL(href, `${ORIGIN}${path}`);
    return url.origin === ORIGIN && !isSkipped(url.pathname)
      ? [`${url.pathname}${url.search}`]
      : [];
  });
};

const expectLinksResolve = async (
  context: BrowserContext,
  request: APIRequestContext,
  startPages: string[],
  redirects: Record<string, string>
) => {
  const targets = new Map<string, string>();
  for (const start of startPages) {
    for (const target of await collectLinks(context, start)) {
      if (!targets.has(target)) targets.set(target, start);
    }
  }
  expect(targets.size, 'The pages have no internal links').toBeGreaterThan(0);

  const checked = [...targets].slice(0, MAX_LINKS);
  const broken: string[] = [];
  for (const [target, source] of checked) {
    const response = await request.get(target);
    const path = new URL(target, ORIGIN).pathname;
    const finalPath = new URL(response.url()).pathname;
    const expectedPath = redirects[path] ?? path;
    const markers = findErrorMarkers(await response.text());

    if (
      response.status() !== 200 ||
      finalPath !== expectedPath ||
      markers.length > 0
    ) {
      broken.push(
        `${target} (on ${source}) ends at ${finalPath} with ${response.status()} ${markers.join(', ')}`
      );
    }
  }

  expect(broken, 'Links that do not resolve').toEqual([]);
};

test.describe('internal links', { tag: '@slow' }, () => {
  // Chromium logs the 404 of /does-not-exist.
  test.use({ allowedPageErrors: [/status of 404 \(/] });

  test('a visitor follows every internal link of the marketing pages', async ({
    context,
    request
  }) => {
    test.info().annotations.push({ type: 'related', description: '#66' });

    await expectLinksResolve(context, request, START_PAGES, VISITOR_REDIRECTS);
  });

  test.describe('as a host', () => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
    test.use({ storageState: personaState('host') });

    test('a host follows every internal link of /home', async ({ context }) => {
      await expectLinksResolve(
        context,
        context.request,
        ['/home'],
        HOST_REDIRECTS
      );
    });
  });
});
