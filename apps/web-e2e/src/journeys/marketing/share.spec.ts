import { expect, test } from '../../fixtures/test';
import { noRedirect } from '../../helpers/http';
import { knownBug } from '../../helpers/known-bug';
import { PUBLIC_PAGES } from '../../helpers/public-pages';

// The title of the root layout, which a page without its own metadata gets.
const ROOT_TITLE = 'GiveawayDog';

// These pages have no metadata of their own (#365). /apps also redirects to
// the login page (#360).
const WITHOUT_TITLE = new Set([
  '/pricing',
  '/examples',
  '/apps',
  '/learn/integrations',
  '/learn/templates',
  '/user/verify',
  '/demo/sweepstakes'
]);

// /contact sets its own openGraph without images, so it drops the image of
// the root layout (#365).
const WITHOUT_IMAGE = new Set(['/contact']);

const meta = (html: string, attribute: string, name: string) =>
  html
    .match(new RegExp(`<meta ${attribute}="${name}" content="([^"]*)"`))?.[1]
    ?.replace(/&amp;/g, '&');

const paths = [...new Set(PUBLIC_PAGES.map(({ path }) => path.split('?')[0]))];

test.describe('share previews', () => {
  for (const path of paths) {
    const isIntegration = path.startsWith('/learn/integrations/');
    const bug =
      WITHOUT_TITLE.has(path) || WITHOUT_IMAGE.has(path) || isIntegration;

    test(
      `${path} has its own title and preview image`,
      bug ? knownBug(365) : {},
      async ({ request }) => {
        const response = await request.get(path, noRedirect);
        expect(response.status(), `GET ${path}`).toBe(200);
        const html = await response.text();

        const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
        expect(title, 'The page has the title of the root layout').not.toBe(
          ROOT_TITLE
        );

        const images = [
          meta(html, 'property', 'og:image'),
          meta(html, 'name', 'twitter:image')
        ];
        for (const image of images) {
          expect(image, 'The page has no preview image').toBeTruthy();

          const { pathname, search } = new URL(image!);
          const imageResponse = await request.get(
            `${pathname}${search}`,
            noRedirect
          );
          expect(imageResponse.status(), `GET ${image}`).toBe(200);
          expect(imageResponse.headers()['content-type']).toBe('image/png');
        }
      }
    );
  }
});
