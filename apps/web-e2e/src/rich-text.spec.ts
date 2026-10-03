import { expect, test } from '@playwright/test';

const RICH_TEXT = 'div[class~="[&_a]:break-all"]';
const MAX_GIVEAWAYS = 5;

const UNSAFE_MARKUP =
  'script, iframe, style, object, embed, img, svg, form, input, [class], [style]:not([style^="text-align"])';
const EVENT_HANDLERS = 'xpath=.//*[@*[starts-with(name(), "on")]]';
const SCRIPT_LINKS =
  'a[href^="javascript:" i], a[href^="data:" i], a[href^="vbscript:" i]';

test.describe('rich text on a public giveaway', () => {
  test.use({ javaScriptEnabled: false });

  test('renders the description on the server through the sanitiser', async ({
    page
  }) => {
    await page.goto('/browse');

    const hrefs = await page
      .locator('a[href^="/browse/"]')
      .evaluateAll((links) =>
        Array.from(
          new Set(links.map((link) => link.getAttribute('href') ?? ''))
        )
      );
    test.skip(
      hrefs.length === 0,
      'The deployment lists no public giveaways to open'
    );

    let checked = 0;
    for (const href of hrefs.slice(0, MAX_GIVEAWAYS)) {
      const response = await page.goto(href);
      expect(response?.status(), `GET ${href}`).toBe(200);

      const descriptions = page.locator(RICH_TEXT);
      for (const description of await descriptions.all()) {
        const unsafe = {
          elements: await description.locator(UNSAFE_MARKUP).count(),
          handlers: await description.locator(EVENT_HANDLERS).count(),
          scriptLinks: await description.locator(SCRIPT_LINKS).count()
        };
        expect(unsafe, `The description on ${href}`).toEqual({
          elements: 0,
          handlers: 0,
          scriptLinks: 0
        });
        checked += 1;
      }

      if (checked > 0) break;
    }

    test.skip(
      checked === 0,
      `None of the first ${MAX_GIVEAWAYS} public giveaways shows a description`
    );
  });
});
