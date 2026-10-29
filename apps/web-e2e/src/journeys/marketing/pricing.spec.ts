import { expect, test } from '../../fixtures/test';
import { E2E_SECRET, personaState } from '../../env';

test.describe('pricing', () => {
  test('a visitor opens /pricing and sees the yearly price', async ({
    page
  }) => {
    const response = await page.request.get('/pricing');
    expect(await response.text()).toContain(
      'Flexible pricing options for creators of all sizes.'
    );

    await page.goto('/pricing');

    await expect(page).toHaveURL(/\/pricing$/);
    await expect(
      page.getByRole('heading', { name: /Get more views with less effort/ })
    ).toBeInViewport();

    await page.getByRole('button', { name: 'Yearly' }).click();

    const pricing = page.locator('#pricing');
    await expect(pricing.getByText('$15', { exact: true })).toBeVisible();
    await expect(pricing.getByText('Billed as $180.00/year')).toBeVisible();
  });

  test.describe('as a host', () => {
    test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
    test.use({ storageState: personaState('host') });

    test('a host follows the Pro call to action to a page about Pro', async ({
      page
    }) => {
      await page.goto('/home#pricing');

      await page
        .locator('#pricing')
        .getByRole('link', { name: /Contact Us/ })
        .click();

      await expect(page).toHaveURL(/\/contact#pro$/);
      await expect(
        page.getByRole('heading', { name: 'Get Giveaway.dog Pro' })
      ).toBeInViewport();
      await expect(
        page.getByRole('link', { name: 'Email us about Pro' })
      ).toHaveAttribute('href', /^mailto:support@giveaway\.dog/);
    });
  });
});
