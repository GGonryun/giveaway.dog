import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { E2E_SECRET, RUN_ID } from '../env';
import { seedApi, seedWorkerTeam } from '../helpers/seed';
import { TAGS } from '../helpers/tags';

type Violation = { directive: string; blocked: string; source: string };

type ViolationEvent = {
  effectiveDirective: string;
  blockedURI: string;
  sourceFile: string;
};

type ViolationTarget = {
  addEventListener: (
    type: 'securitypolicyviolation',
    listener: (event: ViolationEvent) => void
  ) => void;
};

const recordViolations = (page: Page) =>
  page.addInitScript(() => {
    const violations: Violation[] = [];
    Object.assign(globalThis, { __cspViolations: violations });
    (globalThis as unknown as ViolationTarget).addEventListener(
      'securitypolicyviolation',
      (event) => {
        violations.push({
          directive: event.effectiveDirective,
          blocked: event.blockedURI,
          source: event.sourceFile
        });
      }
    );
  });

const expectNoViolations = async (page: Page, path: string) => {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  expect(
    await page.evaluate(
      () =>
        (globalThis as { __cspViolations?: Violation[] }).__cspViolations ?? []
    ),
    `Content-Security-Policy violations on ${path}`
  ).toEqual([]);
};

test.describe(
  'content security policy in the browser',
  { tag: TAGS.security },
  () => {
    test.beforeEach(({ page }) => recordViolations(page));

    for (const path of ['/', '/browse', '/login']) {
      test(`${path} loads without a violation`, async ({ page }) => {
        await expectNoViolations(page, path);
      });
    }

    test('the giveaway page loads without a violation', async ({
      page,
      request
    }, testInfo) => {
      test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug
      });

      await expectNoViolations(page, `/browse/${giveaway.id}`);
      await expect(page.getByRole('heading').first()).toBeVisible();
    });
  }
);
