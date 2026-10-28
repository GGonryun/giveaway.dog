import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import {
  createDraft,
  fillComplete,
  giveawayName,
  headerButton,
  issuesDialog,
  openAsVisitor,
  openStep,
  publishDialog,
  publishNow
} from '../../helpers/editor';
import { readSweepstakes } from '../../helpers/manage';
import { freshSlug, seedApi, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const SLUG_PATTERN = /^[a-zA-Z0-9-]+$/;

const typeSlug = async (page: Page, slug: string) => {
  await openStep(page, 'Audience');
  await page.getByRole('switch', { name: 'Custom URL Slug' }).click();
  await page.getByRole('textbox', { name: 'URL slug' }).fill(slug);
};

test.describe('the custom slug of a giveaway in the editor', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test(
    'a host claims a free custom slug and visitors open the giveaway at it',
    { tag: TAGS.slow },
    async ({ page, request, browser }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const name = giveawayName(testInfo, 'slug');
      const slug = freshSlug(testInfo);

      const id = await createDraft(page, team.slug);
      await fillComplete(page, { name });
      await typeSlug(page, slug);
      await expect(
        page.getByText(`The slug "${slug}" is available`)
      ).toBeVisible();
      await publishNow(page, team.slug, /go live immediately/);

      expect(await readSweepstakes(request, id)).toMatchObject({
        status: 'ACTIVE',
        visibility: { slug }
      });
      const visitor = await openAsVisitor(browser, `/browse/${slug}`);
      await expect(
        visitor.page.getByRole('heading', { name, level: 1 })
      ).toBeVisible();
      await visitor.context.close();
    }
  );

  test(
    'a host cannot publish a giveaway with a slug that another giveaway has',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const { team } = await seedWorkerTeam(request, testInfo);
      const slug = freshSlug(testInfo);
      await seedApi(request).sweepstakes({ ns: RUN_ID, team: team.slug, slug });

      const id = await createDraft(page, team.slug);
      await fillComplete(page, { name: giveawayName(testInfo, 'taken') });
      await typeSlug(page, slug);
      const taken = `The slug "${slug}" is already taken. Please choose another one.`;
      await expect(page.getByText(taken)).toBeVisible();

      await headerButton(page, 'Publish').click();
      await expect(
        issuesDialog(page).getByRole('button', {
          name: `visibility.slug ${taken}`
        })
      ).toBeVisible();
      await expect(publishDialog(page)).toBeHidden();
      expect(await readSweepstakes(request, id)).toMatchObject({
        status: 'DRAFT'
      });
    }
  );

  test("a host cannot take another giveaway's id as a custom slug", async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    let other = '';
    for (let attempt = 0; attempt < 5 && !SLUG_PATTERN.test(other); attempt++) {
      ({ id: other } = await seedApi(request).sweepstakes({
        ns: RUN_ID,
        team: team.slug
      }));
    }
    expect(other).toMatch(SLUG_PATTERN);

    await createDraft(page, team.slug);
    await typeSlug(page, other);
    await expect(
      page.getByText(
        `The slug "${other}" is already taken. Please choose another one.`
      )
    ).toBeVisible();
  });
});
