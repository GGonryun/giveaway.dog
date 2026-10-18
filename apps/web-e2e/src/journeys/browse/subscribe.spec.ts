import { randomUUID } from 'crypto';
import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';

const subscriptionCard = async (page: Page) => {
  await page.goto('/browse');
  await expect(
    page.getByRole('heading', { name: 'Never miss a giveaway!' })
  ).toBeVisible();

  return {
    email: page.getByRole('textbox', { name: 'Enter your email' }),
    subscribe: page.getByRole('button', { name: 'Subscribe' })
  };
};

test.describe('new-giveaway emails', () => {
  test('a visitor cannot subscribe an invalid email', async ({ page }) => {
    const { email, subscribe } = await subscriptionCard(page);

    await email.fill('not-an-email');
    await expect(
      page.getByText('Please enter a valid email address')
    ).toBeVisible();
    await expect(subscribe).toBeDisabled();

    await email.fill('x@mailinator.com');
    await expect(
      page.getByText('Please use a valid email address')
    ).toBeVisible();
    await expect(subscribe).toBeDisabled();
  });

  // This writes a row without auth, rate limit or Turnstile, and nothing
  // deletes it. The address is on example.com, so no email goes out.
  test('a visitor subscribes, and again in mixed case', async ({ page }) => {
    const address = `e2e+${randomUUID()}@example.com`;

    let { email, subscribe } = await subscriptionCard(page);
    await email.fill(address);
    await subscribe.click();

    await expect(page.getByText('Successfully subscribed!')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: "You're all set!" })
    ).toBeVisible();

    // The upsert lower-cases the email, so the form tells nobody whether an
    // address is already subscribed.
    ({ email, subscribe } = await subscriptionCard(page));
    await email.fill(
      address.toUpperCase().replace('@EXAMPLE.COM', '@Example.com')
    );
    await subscribe.click();

    await expect(
      page.getByRole('heading', { name: "You're all set!" })
    ).toBeVisible();
  });
});
