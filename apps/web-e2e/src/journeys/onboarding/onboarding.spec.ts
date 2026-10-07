import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { BYPASS_STATE, E2E_SECRET } from '../../env';
import { STUB_BLOB_URL, stubBlobUploads } from '../../helpers/blob';
import { expectAfterReloads } from '../../helpers/poll';
import {
  captureServerAction,
  readActionResult,
  replayServerAction,
  rewriteServerActions
} from '../../helpers/rsc';
import { blockThirdParties } from '../../helpers/third-party';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const openProfileStep = async (page: Page, username: string) => {
  await page.goto('/onboarding');
  await expect(page.getByText('Welcome to Giveaway.dog')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Username').fill(username);
};

const completeSetup = (page: Page) =>
  page.getByRole('button', { name: 'Complete Setup' }).click();

test.describe('onboarding', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('a newbie finishes onboarding with a profile picture', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('newbie');
    const uploads = await stubBlobUploads(page);
    await openProfileStep(page, `e2e_${ns}`);

    const chooser = page.waitForEvent('filechooser');
    await page.getByText('Drag and drop files here').click();
    await (
      await chooser
    ).setFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });

    await expect(page.getByRole('img', { name: 'Preview' })).toBeVisible();
    expect(uploads).toEqual([{ pathname: 'avatar.png', url: STUB_BLOB_URL }]);

    await completeSetup(page);

    await expect(page).toHaveURL(/\/browse$/);
    await page.goto('/account');
    await expectAfterReloads(page, () =>
      expect(page.getByRole('img', { name: 'Preview' })).toHaveAttribute(
        'src',
        STUB_BLOB_URL
      )
    );
  });

  test('the server refuses a username that the form refuses', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('newbie');
    await openProfileStep(page, 'valid_name');
    const { responses } = await rewriteServerActions(page, ([input]) => [
      { ...(input as object), username: 'x' }
    ]);

    await completeSetup(page);

    await expect.poll(() => responses.length).toBe(1);
    expect(readActionResult(responses[0])).toMatchObject({
      ok: false,
      data: { code: 'UNPROCESSABLE_CONTENT' }
    });
    await page.goto('/browse');
    await expect(page).toHaveURL(/\/onboarding$/);
  });
});

test.describe('onboarding replay', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');
  test.use({ allowedPageErrors: ['net::ERR_FAILED'] });

  test('a visitor cannot replay the onboarding of a newbie', async ({
    browser,
    page,
    freshPersona
  }) => {
    await freshPersona('newbie');
    await openProfileStep(page, 'valid_name');
    const action = await captureServerAction(page, () => completeSetup(page), {
      abort: true
    });

    const visitor = await browser.newContext({ storageState: BYPASS_STATE });
    await blockThirdParties(visitor);
    const visitorPage = await visitor.newPage();
    await visitorPage.goto('/');

    const response = await replayServerAction(visitorPage, action);

    expect(readActionResult(response)).toMatchObject({
      ok: false,
      data: { code: 'UNAUTHORIZED' }
    });
    await visitor.close();
  });
});
