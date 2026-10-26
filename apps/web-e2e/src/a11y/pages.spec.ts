import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { freshNamespace } from '../fixtures/personas';
import { E2E_SECRET, RUN_ID, personaState } from '../env';
import { createDraft } from '../helpers/editor';
import { blockThirdParties } from '../helpers/third-party';
import { seedApi, seedWorkerTeam } from '../helpers/seed';
import { TAGS } from '../helpers/tags';
import {
  eligibleEntries,
  endedGiveaway,
  winnersPage
} from '../helpers/winners';

const MOBILE = [TAGS.a11y, TAGS.mobile];

const settle = (page: Page) => page.waitForLoadState('networkidle');

test.describe('accessibility of the public pages', () => {
  test('the home page', { tag: MOBILE }, async ({ page, checkA11y }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
    await settle(page);
    await checkA11y(page, { name: 'home' });
  });

  test('the login page', { tag: MOBILE }, async ({ page, checkA11y }) => {
    await page.goto('/login');
    await expect(
      page.getByRole('button', { name: 'Login with Bluesky' })
    ).toBeVisible();
    await settle(page);
    await checkA11y(page, { name: 'login' });
  });

  test('the browse page', { tag: MOBILE }, async ({ page, checkA11y }) => {
    await page.goto('/browse');
    await expect(page.getByRole('main')).toBeVisible();
    await settle(page);
    await checkA11y(page, { name: 'browse' });
  });
});

test.describe('accessibility of a running giveaway', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');

  test(
    'a visitor and a participant',
    { tag: MOBILE },
    async ({ browser, page, request, checkA11y }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug,
        audience: { allowedIdentities: ['ANONYMOUS'], formFields: [] },
        tasks: [
          { type: 'BONUS_TASK', title: 'Claim a free entry', value: 1 },
          {
            type: 'ASK_QUESTION',
            title: 'Tell us about you',
            question: 'What is your favorite color?',
            value: 2
          }
        ],
        prizes: [{ name: 'Signed poster' }]
      });
      const path = `/browse/${giveaway.id}`;

      await page.goto(path);
      await expect(
        page.getByRole('heading', { name: giveaway.name, level: 1 })
      ).toBeVisible();
      await settle(page);
      await checkA11y(page, { name: 'giveaway as a visitor' });

      const context = await browser.newContext({
        ...testInfo.project.use,
        storageState: personaState('participant')
      });
      await blockThirdParties(context);
      try {
        const participant = await context.newPage();
        await participant.goto(path);
        await participant.getByRole('tab', { name: 'Tasks' }).click();
        await expect(
          participant.getByRole('heading', { name: 'Claim a free entry' })
        ).toBeVisible();
        await settle(participant);
        await checkA11y(participant, {
          name: 'giveaway tasks as a participant'
        });
      } finally {
        await context.close();
      }
    }
  );
});

test.describe('accessibility of the host pages', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test('the team picker', { tag: MOBILE }, async ({ page, checkA11y }) => {
    await page.goto('/app');
    await expect(page.getByText('Choose Your Team')).toBeVisible();
    await settle(page);
    await checkA11y(page, { name: 'team picker' });
  });

  test(
    'the host dashboard',
    { tag: TAGS.a11y },
    async ({ page, request, checkA11y }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      await page.goto(`/app/${team.slug}`);
      await expect(
        page.getByRole('button', { name: 'Create', exact: true })
      ).toBeVisible();
      await settle(page);
      await checkA11y(page, { name: 'host dashboard' });
    }
  );

  test(
    'the first step of the editor',
    { tag: TAGS.a11y },
    async ({ page, request, checkA11y }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      await createDraft(page, team.slug);
      await settle(page);
      await checkA11y(page, { name: 'editor setup step' });
    }
  );

  test(
    'the winners tab of a giveaway',
    { tag: TAGS.a11y },
    async ({ page, request, checkA11y }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const giveaway = await seedApi(request).sweepstakes(
        endedGiveaway({
          ns: freshNamespace(testInfo.workerIndex),
          team: team.slug,
          entries: eligibleEntries(['participant'])
        })
      );
      await page.goto(winnersPage(team.slug, giveaway.id));
      await expect(
        page.getByRole('button', { name: 'Pick All Winners' })
      ).toBeVisible();
      await settle(page);
      await checkA11y(page, { name: 'winners tab' });
    }
  );
});

test.describe('accessibility of the account page', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in');
  test.use({ storageState: personaState('participant') });

  test('the account page', { tag: TAGS.a11y }, async ({ page, checkA11y }) => {
    await page.goto('/account');
    await expect(page.getByRole('main')).toBeVisible();
    await settle(page);
    await checkA11y(page, { name: 'account' });
  });
});
