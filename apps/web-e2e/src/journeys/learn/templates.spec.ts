import { expect, test } from '../../fixtures/test';
import { knownBug } from '../../helpers/known-bug';

const TEMPLATE_IDS = ['basic-giveaway', 'x-giveaway', 'anonymous-sweepstakes'];

test.describe('official templates', () => {
  test('a visitor opens a template from the gallery and closes it', async ({
    page
  }) => {
    await page.goto('/learn/templates');

    await page
      .getByRole('link', { name: /Basic Giveaway/ })
      .first()
      .click();

    await expect(page).toHaveURL(/\/learn\/templates\/basic-giveaway$/);
    const dialog = page.getByRole('dialog', { name: 'Basic Giveaway' });
    await expect(
      dialog.getByRole('button', { name: 'Customize Template' })
    ).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Use Template' })
    ).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/learn\/templates$/);
  });

  test('Use Template sends a visitor to the login page', async ({ page }) => {
    await page.goto('/learn/templates');
    await page
      .getByRole('link', { name: /Basic Giveaway/ })
      .first()
      .click();

    await page
      .getByRole('dialog', { name: 'Basic Giveaway' })
      .getByRole('button', { name: 'Use Template' })
      .click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test.describe('direct links', () => {
    // Chromium logs the 404 of the document.
    test.use({ allowedPageErrors: [/status of 404 \(/] });

    for (const id of TEMPLATE_IDS) {
      test(
        `a visitor opens /learn/templates/${id} by a direct link`,
        knownBug(362),
        async ({ page }) => {
          const response = await page.goto(`/learn/templates/${id}`);

          expect(response?.status()).toBe(200);
          await expect(page.getByRole('dialog')).toBeVisible();
        }
      );
    }
  });
});
