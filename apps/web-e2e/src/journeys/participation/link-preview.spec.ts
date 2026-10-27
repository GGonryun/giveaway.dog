import type { APIRequestContext, TestInfo } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../../env';
import { knownBug } from '../../helpers/known-bug';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';

const BOT = { 'User-Agent': 'Twitterbot/1.0' };
const BANNER = '/images/demo-sweepstakes-banner-2.jpg';
const PRIZE = 'A ceramic mug';

const unescape = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const meta = (html: string, attribute: string, name: string) => {
  const value = html.match(
    new RegExp(`<meta ${attribute}="${name}" content="([^"]*)"`)
  )?.[1];
  return value === undefined ? undefined : unescape(value);
};

const loadPreview = async (request: APIRequestContext, testInfo: TestInfo) => {
  const { team } = await seedWorkerTeam(request, testInfo);
  const giveaway = await seedApi(request).sweepstakes({
    ns: RUN_ID,
    team: team.slug,
    name: 'Mug giveaway',
    description: '<p>Win a <strong>mug</strong> for your desk</p>',
    prizes: [{ name: PRIZE }]
  });
  const response = await request.get(`/browse/${giveaway.id}`, {
    headers: BOT
  });
  expect(response.status()).toBe(200);
  return { html: await response.text(), team, giveaway };
};

test.describe('link previews of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a link-preview bot reads the title, the image and the card of a giveaway', async ({
    request
  }, testInfo) => {
    const { html, team } = await loadPreview(request, testInfo);

    expect(unescape(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')).toBe(
      `[e2e ${RUN_ID}] Mug giveaway | Giveaway by ${team.name}`
    );
    expect(meta(html, 'property', 'og:title')).toBe(
      `[e2e ${RUN_ID}] Mug giveaway | ${team.name}`
    );
    expect(new URL(meta(html, 'property', 'og:image')!).pathname).toBe(BANNER);
    expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(new URL(meta(html, 'name', 'twitter:image')!).pathname).toBe(BANNER);
    expect(meta(html, 'property', 'og:description')).toContain(PRIZE);
  });

  test(
    'a link-preview bot reads the description as plain text',
    knownBug(590),
    async ({ request }, testInfo) => {
      const { html } = await loadPreview(request, testInfo);

      const description = meta(html, 'name', 'description');
      expect(description).toContain('Win a mug for your desk');
      expect(description).not.toMatch(/<[a-z/]/);
    }
  );
});
