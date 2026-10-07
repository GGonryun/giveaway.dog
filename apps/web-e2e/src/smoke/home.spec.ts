import { expect, test } from '../fixtures/test';

test.describe('home page', { tag: '@smoke' }, () => {
  test('shows the hero to a visitor', { tag: '@mobile' }, async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Giveaway\.dog/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'How creators build bigger communities'
      })
    ).toBeVisible();
  });

  test('opens the login page from the navigation bar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Login', exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Connect with us')).toBeVisible();
  });
});
