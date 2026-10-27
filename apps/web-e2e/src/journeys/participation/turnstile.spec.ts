import type { BrowserContext } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE, E2E_SECRET, RUN_ID } from '../../env';
import { seedApi, seedWorkerTeam } from '../../helpers/seed';
import { blockThirdParties } from '../../helpers/third-party';

type StubbedTurnstile = { __solveTurnstile: () => void };

const TURNSTILE_SCRIPT =
  'https://challenges.cloudflare.com/turnstile/v0/api.js*';
const COOKIE = 'turnstile_verified';
const BONUS = 'Claim a free entry';

const STUB_SCRIPT = `
(() => {
  let resolve;
  const solved = new Promise((r) => (resolve = r));
  window.__solveTurnstile = () => resolve();
  window.turnstile = {
    render(container, options) {
      solved.then(() => options.callback('XXXX.DUMMY.TOKEN.XXXX'));
      return 'e2e-turnstile';
    },
    getResponse: () => 'XXXX.DUMMY.TOKEN.XXXX',
    isExpired: () => false,
    reset() {},
    remove() {},
    ready(callback) {
      callback();
    }
  };
  const onload = new URL(document.currentScript.src).searchParams.get('onload');
  if (onload && typeof window[onload] === 'function') window[onload]();
})();
`;

const stubTurnstile = (context: BrowserContext) =>
  context.route(TURNSTILE_SCRIPT, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: STUB_SCRIPT })
  );

test.describe('the security check of a giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test('a visitor sees the giveaway only after passing the security check', async ({
    browser,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const giveaway = await seedApi(request).sweepstakes({
      ns: RUN_ID,
      team: team.slug,
      tasks: [{ type: 'BONUS_TASK', title: BONUS }]
    });
    const context = await browser.newContext({ storageState: BYPASS_STATE });
    await blockThirdParties(context);
    await stubTurnstile(context);
    const page = await context.newPage();

    await page.goto(`/browse/${giveaway.id}`);
    await expect(
      page.getByRole('heading', { name: `[e2e ${RUN_ID}] Giveaway` })
    ).toBeVisible();
    const check = page.getByRole('heading', { name: 'Security Verification' });
    test.skip(
      !(await check.isVisible()),
      'The deployment has no Turnstile site key, so it shows no security check'
    );
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeHidden();
    expect(
      (await context.cookies()).find(({ name }) => name === COOKIE)
    ).toBeUndefined();

    await page.waitForFunction(() => 'turnstile' in globalThis);
    await page.evaluate(() =>
      (globalThis as unknown as StubbedTurnstile).__solveTurnstile()
    );

    await expect(check).toBeHidden();
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible();
    await expect
      .poll(async () =>
        (await context.cookies()).some(({ name }) => name === COOKIE)
      )
      .toBe(true);

    await page.reload();
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible();
    await expect(check).toBeHidden();
    await context.close();
  });
});
