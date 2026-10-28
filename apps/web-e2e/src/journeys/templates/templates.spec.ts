import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, RUN_ID, personaState } from '../../env';
import { clickUntilUrl } from '../../helpers/editor';
import { seedSweepstakes } from '../../helpers/jobs';
import { knownBug } from '../../helpers/known-bug';
import { freshSlug, seedApi, seedWorkerTeam } from '../../helpers/seed';
import { TAGS } from '../../helpers/tags';

const DRAFT_URL = /\/sweepstakes\/([^/]+)\/create$/;
const TEMPLATE_URL = /\/templates\/([^/?]+)\/(create|edit)/;

type DraftRows = {
  sweepstakes: {
    status: string;
    details: { name: string } | null;
    visibility: { visibility: string; slug: string | null } | null;
    _count: { tasks: number; prizes: number };
  };
};

const step = (page: Page, name: string) =>
  page.getByRole('tab', { name, exact: true }).first().click();

const idFrom = (page: Page, pattern: RegExp) => {
  const match = pattern.exec(new URL(page.url()).pathname);
  if (!match) throw new Error(`${page.url()} does not match ${pattern}`);
  return match[1];
};

const createTemplate = async (
  page: Page,
  team: string,
  template: { name: string; giveaway: string; slug?: string }
) => {
  await page.goto(`/app/${team}/templates`);
  await clickUntilUrl(
    page,
    page.getByRole('button', { name: 'Create', exact: true }),
    TEMPLATE_URL
  );
  const id = idFrom(page, TEMPLATE_URL);

  await page
    .getByRole('textbox', { name: 'Template Name' })
    .fill(template.name);
  await page
    .getByRole('textbox', { name: 'Description' })
    .fill(`Made by the e2e run ${RUN_ID}`);

  await step(page, 'Setup');
  await page
    .getByRole('textbox', { name: 'Default Name' })
    .fill(template.giveaway);

  if (template.slug) {
    await step(page, 'Audience');
    await page.getByRole('switch', { name: 'Custom URL Slug' }).click();
    await page.getByRole('textbox', { name: 'URL slug' }).fill(template.slug);
  }

  await step(page, 'Tasks');
  await page.getByRole('button', { name: 'Add Entry Method' }).click();
  await page.getByRole('dialog').getByText('Bonus', { exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();

  await step(page, 'Prizes');
  await page.getByRole('button', { name: 'Add New Prize' }).click();

  await saveTemplate(page, team, 'Save Template');
  return id;
};

const saveTemplate = async (
  page: Page,
  team: string,
  button: 'Save Template' | 'Update Template'
) => {
  await page
    .getByRole('button', {
      name: button === 'Save Template' ? 'Publish' : 'Save Changes'
    })
    .click();
  await page.getByRole('button', { name: button }).click();
  await expect(page).toHaveURL(new RegExp(`/app/${team}/templates$`));
};

const findCard = async (page: Page, name: string) => {
  await page.getByPlaceholder('Search templates...').fill(name);
  return page.locator('[data-slot="card"]').filter({ hasText: name });
};

const useTemplate = async (page: Page, team: string, name: string) => {
  await page.goto(`/app/${team}/templates`);
  const card = await findCard(page, name);
  await expect(card.getByText('Custom', { exact: true })).toBeVisible();
  await card.click();
  await page
    .getByRole('dialog', { name })
    .getByRole('button', { name: 'Use Template' })
    .click();
  await expect(page).toHaveURL(DRAFT_URL, { timeout: 30_000 });
  return idFrom(page, DRAFT_URL);
};

test.describe('team templates', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to call the seed API');
  test.use({ storageState: personaState('host') });

  test(
    'a host creates, edits, uses and deletes a custom template',
    { tag: TAGS.slow },
    async ({ page, request }, testInfo) => {
      const seed = seedApi(request);
      const { team } = await seedWorkerTeam(request, testInfo);
      const tag = freshSlug(testInfo);
      const name = `Template ${tag}`;
      const giveaway = `[e2e ${RUN_ID}] From ${tag}`;

      const templateId = await createTemplate(page, team.slug, {
        name,
        giveaway
      });

      const draftId = await useTemplate(page, team.slug, name);
      await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
        giveaway
      );
      const draft = await seed.rows<DraftRows>({
        view: 'sweepstakes',
        id: draftId
      });
      expect(draft.sweepstakes).toMatchObject({
        status: 'DRAFT',
        details: { name: giveaway },
        _count: { tasks: 1, prizes: 1 }
      });

      const renamed = `${giveaway} (draft)`;
      await page.getByRole('textbox', { name: 'Name' }).fill(renamed);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await page.getByRole('button', { name: 'Save & Exit' }).click();
      await expect(page).toHaveURL(new RegExp(`/app/${team.slug}$`), {
        timeout: 30_000
      });
      const saved = await seed.rows<DraftRows>({
        view: 'sweepstakes',
        id: draftId
      });
      expect(saved.sweepstakes.details?.name).toBe(renamed);

      await page.goto(`/app/${team.slug}/templates`);
      const card = await findCard(page, name);
      await card.getByRole('button', { name: 'Template actions' }).click();
      await page.getByRole('menuitem', { name: 'Edit' }).click();
      await expect(page).toHaveURL(new RegExp(`/templates/${templateId}/edit`));
      await step(page, 'Setup');
      const defaultName = page.getByRole('textbox', { name: 'Default Name' });
      await expect(defaultName).toHaveValue(giveaway);

      const edited = `${giveaway} (edited)`;
      await defaultName.fill(edited);
      await saveTemplate(page, team.slug, 'Update Template');

      await page.goto(`/app/${team.slug}/templates/${templateId}/edit`);
      await step(page, 'Setup');
      await expect(
        page.getByRole('textbox', { name: 'Default Name' })
      ).toHaveValue(edited);
      const untouched = await seed.rows<DraftRows>({
        view: 'sweepstakes',
        id: draftId
      });
      expect(untouched.sweepstakes.details?.name).toBe(renamed);

      await page.goto(`/app/${team.slug}/templates`);
      const deleting = await findCard(page, name);
      await deleting.getByRole('button', { name: 'Template actions' }).click();
      await page.getByRole('menuitem', { name: 'Delete' }).click();
      const dialog = page.getByRole('dialog', { name: 'Delete Template' });
      await dialog.getByRole('textbox').fill(name);
      await dialog.getByRole('button', { name: 'Delete Template' }).click();
      await expect(
        page.getByText('Template deleted successfully', { exact: true })
      ).toBeVisible();
      await expect(deleting).toHaveCount(0);
    }
  );

  test('a host discards a new template, which deletes it', async ({
    page,
    request
  }, testInfo) => {
    const { team } = await seedWorkerTeam(request, testInfo);
    const name = `Template ${freshSlug(testInfo)}`;
    await page.goto(`/app/${team.slug}/templates`);
    await clickUntilUrl(
      page,
      page.getByRole('button', { name: 'Create', exact: true }),
      TEMPLATE_URL
    );
    await page.getByRole('textbox', { name: 'Template Name' }).fill(name);

    await page.getByRole('button', { name: 'Cancel' }).click();
    await page
      .getByRole('dialog', { name: "You're exiting the Template Editor" })
      .getByRole('button', { name: 'Delete Template' })
      .click();
    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}/templates$`));
    await expect(
      page.getByText('Template deleted successfully!', { exact: true })
    ).toBeVisible();

    await page.goto(`/app/${team.slug}/templates`);
    await findCard(page, name);
    await expect(
      page.getByText(`No templates found matching "${name}"`)
    ).toBeVisible();
  });

  test(
    'a host creates two giveaways from a template that sets a custom slug',
    knownBug(513, { tag: TAGS.slow }),
    async ({ page, request }, testInfo) => {
      const seed = seedApi(request);
      const { team } = await seedWorkerTeam(request, testInfo);
      const tag = freshSlug(testInfo);
      const name = `Template ${tag}`;

      await createTemplate(page, team.slug, {
        name,
        giveaway: `[e2e ${RUN_ID}] Slug ${tag}`,
        slug: `${tag}-tpl`
      });

      const first = await useTemplate(page, team.slug, name);
      const second = await useTemplate(page, team.slug, name);

      expect(second).not.toBe(first);
      for (const id of [first, second]) {
        const rows = await seed.rows<DraftRows>({ view: 'sweepstakes', id });
        expect(rows.sweepstakes.status).toBe('DRAFT');
      }
    }
  );

  test('a host turns a giveaway into a template from the dashboard', async ({
    page,
    request
  }, testInfo) => {
    const seed = seedApi(request);
    const { team } = await seedWorkerTeam(request, testInfo);
    const tag = freshSlug(testInfo);
    const giveaway = await seedSweepstakes(request, {
      ns: RUN_ID,
      team: team.slug,
      name: `Templatize ${tag}`,
      slug: tag,
      tasks: [
        { type: 'BONUS_TASK' },
        { type: 'VISIT_URL', href: 'https://example.com' }
      ],
      prizes: [{ name: 'First prize' }, { name: 'Second prize', quota: 2 }]
    });
    const name = `${giveaway.name} Template`;

    await page.goto(`/app/${team.slug}`);
    await page
      .getByRole('row')
      .filter({ hasText: giveaway.name })
      .getByRole('button', { name: 'Giveaway actions' })
      .click();
    await page.getByRole('menuitem', { name: 'Templatize' }).click();
    await expect(page).toHaveURL(TEMPLATE_URL, { timeout: 30_000 });
    expect(page.url()).toContain('/edit');
    await expect(
      page.getByRole('textbox', { name: 'Template Name' })
    ).toHaveValue(name);

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Incomplete Template:')).toBeVisible();
    await page.getByRole('button', { name: 'Update Template' }).click();
    await expect(page).toHaveURL(new RegExp(`/app/${team.slug}/templates$`));

    const draftId = await useTemplate(page, team.slug, name);
    const draft = await seed.rows<DraftRows>({
      view: 'sweepstakes',
      id: draftId
    });
    expect(draft.sweepstakes).toMatchObject({
      status: 'DRAFT',
      details: { name: giveaway.name },
      visibility: { slug: null },
      _count: { tasks: 2, prizes: 2 }
    });
  });

  test.describe("the dashboard's template grid", () => {
    const seedTemplate = async (page: Page, team: string, tag: string) => {
      const name = `Template ${tag}`;
      await createTemplate(page, team, {
        name,
        giveaway: `[e2e ${RUN_ID}] Grid ${tag}`
      });
      await page.goto(`/app/${team}`);
      return page.locator('[data-slot="card"]').filter({ hasText: name });
    };

    test(
      'a host edits a custom template from the dashboard',
      knownBug(514),
      async ({ page, request }, testInfo) => {
        const { team } = await seedWorkerTeam(request, testInfo);
        const card = await seedTemplate(page, team.slug, freshSlug(testInfo));

        await card.click();
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'Edit Template' })
          .click();
        await expect(page).toHaveURL(/\/templates\/[^/]+\/edit$/, {
          timeout: 10_000
        });
      }
    );

    test(
      'a host deletes a custom template from the dashboard',
      knownBug(514),
      async ({ page, request }, testInfo) => {
        const { team } = await seedWorkerTeam(request, testInfo);
        const tag = freshSlug(testInfo);
        const card = await seedTemplate(page, team.slug, tag);

        await card.getByRole('button', { name: 'Template actions' }).click();
        await page.getByRole('menuitem', { name: 'Delete' }).click();
        await expect(
          page.getByRole('dialog', { name: 'Delete Template' })
        ).toBeVisible({ timeout: 10_000 });
      }
    );
  });
});
