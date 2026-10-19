import type { APIRequestContext, Page } from '@playwright/test';
import { test } from '../fixtures/test';
import { fakesOf, linkInEmail, waitForEmail } from './outbox';
import { seedApi } from './seed';

export const skipWithoutEmailFake = async (request: APIRequestContext) => {
  const fakes = fakesOf(await seedApi(request).health());
  test.skip(!fakes.includes('email'), 'Set E2E_FAKE_EXTERNALS to email');
};

export const requestMagicLink = async (
  page: Page,
  request: APIRequestContext,
  email: string
) => {
  await page.getByRole('button', { name: 'More ways to sign in' }).click();
  await page.getByRole('button', { name: 'Login with Email' }).click();
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('button', { name: 'Send Login Link' }).click();

  const message = await waitForEmail(request, email, /Sign-In Link/);
  return linkInEmail(message, '/api/auth/callback/email');
};
