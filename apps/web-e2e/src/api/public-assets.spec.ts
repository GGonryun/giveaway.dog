import { expect, test } from '../fixtures/test';
import { noRedirect } from '../helpers/http';
import { knownBug } from '../helpers/known-bug';

const ASSETS: { path: string; contentType: string; bug?: number }[] = [
  { path: '/favicon.ico', contentType: 'image/x-icon' },
  { path: '/favicon-16x16.png', contentType: 'image/png' },
  { path: '/favicon-32x32.png', contentType: 'image/png' },
  // The middleware runs on public files, and the path starts with /app.
  { path: '/apple-touch-icon.png', contentType: 'image/png', bug: 360 },
  { path: '/android-chrome-192x192.png', contentType: 'image/png' },
  { path: '/android-chrome-512x512.png', contentType: 'image/png' },
  { path: '/site.webmanifest', contentType: 'application/manifest+json' },
  { path: '/logo.png', contentType: 'image/png' },
  { path: '/api/og', contentType: 'image/png' },
  { path: '/api/og/browse', contentType: 'image/png' }
];

type Manifest = {
  name: string;
  short_name: string;
  icons: { src: string; type: string }[];
};

test.describe('site icons and images', { tag: '@prod-safe' }, () => {
  for (const { path, contentType, bug } of ASSETS) {
    test(
      `a visitor fetches ${path}`,
      bug ? knownBug(bug) : {},
      async ({ request }) => {
        const response = await request.get(path, noRedirect);

        expect(response.status(), `GET ${path}`).toBe(200);
        expect(response.headers()['content-type']).toContain(contentType);
      }
    );
  }

  test('a visitor fetches every icon of the manifest', async ({ request }) => {
    const manifest: Manifest = await (
      await request.get('/site.webmanifest', noRedirect)
    ).json();

    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      const response = await request.get(icon.src, noRedirect);
      expect(response.status(), `GET ${icon.src}`).toBe(200);
      expect(response.headers()['content-type']).toContain(icon.type);
    }
  });

  test('the manifest names the app', knownBug(361), async ({ request }) => {
    const manifest: Manifest = await (
      await request.get('/site.webmanifest', noRedirect)
    ).json();

    expect(manifest.name).toMatch(/Giveaway/);
    expect(manifest.short_name).toMatch(/\S/);
  });

  test('the pages link the manifest', knownBug(361), async ({ request }) => {
    const html = await (await request.get('/', noRedirect)).text();

    const link = html.match(/<link[^>]*rel="manifest"[^>]*>/)?.[0];
    expect(link, 'The page has no manifest link').toContain(
      'href="/site.webmanifest"'
    );
  });
});
