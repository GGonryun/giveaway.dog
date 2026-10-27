import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/test';
import { E2E_SECRET } from '../../env';
import { STUB_BLOB_URL, stubBlobUploads } from '../../helpers/blob';
import { knownBug } from '../../helpers/known-bug';
import { expectAfterReloads } from '../../helpers/poll';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

const ACCOUNT_TABS = [
  { path: '/account', tab: 'Profile', content: 'Display Name' },
  { path: '/account/profile', tab: 'Profile', content: 'Display Name' },
  {
    path: '/account/history',
    tab: 'History',
    content: "You haven't participated in any giveaways yet."
  },
  { path: '/account/features', tab: 'Features', content: 'Host Sweepstakes' },
  {
    path: '/account/notifications',
    tab: 'Notifications',
    content: 'Notification settings coming soon!'
  },
  {
    path: '/account/danger-zone',
    tab: 'Danger Zone',
    content: 'Delete Account'
  }
];

const settingsCard = (page: Page, title: string) =>
  page.locator('[data-slot="card"]').filter({ hasText: title });

const accountRow = (page: Page, label: string) =>
  page
    .getByText(label, { exact: true })
    .locator('xpath=ancestor::div[contains(@class, "rounded-lg")][1]');

const LINK_TIMEOUT = 20_000;

const linkProfile = async (
  page: Page,
  label: 'Instagram' | 'Facebook',
  url: string,
  handle: string
) => {
  await page.waitForLoadState('networkidle');
  await accountRow(page, label)
    .getByRole('button', { name: 'Connect' })
    .click();
  await page.getByLabel(`${label} Profile URL`).fill(url);
  await accountRow(page, label)
    .getByRole('button', { name: 'Connect' })
    .click();
  await expect(accountRow(page, label)).toContainText(handle, {
    timeout: LINK_TIMEOUT
  });
};

const NO_LONGER_LINKED =
  /The connected account you had selected is no longer linked/;

test.describe('account tabs', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-022] each account tab opens from its URL', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('participant');

    for (const { path, tab, content } of ACCOUNT_TABS) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByText(content).first()).toBeVisible();
    }
  });
});

test.describe('appearance', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test(
    '[ACCOUNT-021] a theme picked on the appearance tab stays after a reload',
    knownBug(570),
    async ({ page, freshPersona }) => {
      await freshPersona('participant');
      await page.emulateMedia({ colorScheme: 'light' });
      await page.goto('/account/appearance');
      await expect(
        page.getByRole('tab', { name: 'Appearance' })
      ).toHaveAttribute('aria-selected', 'true');
      const html = page.locator('html');

      await page.getByRole('radio', { name: 'Dark' }).click();
      await expect(html).toHaveClass(/\bdark\b/);
      await page.reload();
      await expect(html).toHaveClass(/\bdark\b/);
      await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();

      await page.getByRole('radio', { name: 'Light' }).click();
      await expect(html).not.toHaveClass(/\bdark\b/);
      await page.reload();
      await expect(html).not.toHaveClass(/\bdark\b/);
      await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
    }
  );
});

test.describe('profile image', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-023] a user uploads a profile image', async ({
    page,
    freshPersona
  }) => {
    await freshPersona('participant');
    const uploads = await stubBlobUploads(page);
    await page.goto('/account');
    await page.waitForLoadState('networkidle');

    const card = settingsCard(page, 'Profile Image');
    const chooser = page.waitForEvent('filechooser');
    await card.getByText('Drag and drop files here').click();
    await (
      await chooser
    ).setFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG });
    await expect(card.getByRole('img', { name: 'Preview' })).toBeVisible();
    await expect(card.getByText('Uploading...')).toBeHidden();
    expect(uploads).toEqual([{ pathname: 'avatar.png', url: STUB_BLOB_URL }]);
    await card.getByRole('button', { name: 'Save' }).click();
    await expect(
      page.getByText('Profile image updated successfully')
    ).toBeVisible();

    await expectAfterReloads(page, () =>
      expect(
        settingsCard(page, 'Profile Image').getByRole('img', {
          name: 'Preview'
        })
      ).toHaveAttribute('src', STUB_BLOB_URL)
    );
    await expect(
      page.getByRole('button').getByRole('img', { name: 'E2E participant' })
    ).toHaveAttribute('src', STUB_BLOB_URL);
  });
});

test.describe('preferred contact method', () => {
  test.skip(!E2E_SECRET, 'Set E2E_LOGIN_SECRET to sign in the personas');

  test('[ACCOUNT-019] [ACCOUNT-020] a user picks a preferred contact method and is warned after disconnecting it', async ({
    page,
    freshPersona
  }) => {
    const { ns } = await freshPersona('participant');
    await page.goto('/account');
    await linkProfile(
      page,
      'Facebook',
      `https://facebook.com/e2e.${ns}`,
      `e2e.${ns}`
    );
    await linkProfile(
      page,
      'Instagram',
      `https://instagram.com/e2e_${ns}`,
      `@e2e_${ns}`
    );
    await page.waitForLoadState('networkidle');

    const card = settingsCard(page, 'Preferred Contact Method');
    await card.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Instagram' }).click();
    await card.getByRole('button', { name: 'Save' }).click();
    await expect(
      page.getByText('Contact method updated successfully')
    ).toBeVisible();
    await page.reload();
    await expect(
      settingsCard(page, 'Preferred Contact Method').getByRole('combobox')
    ).toHaveText('Instagram');
    await expect(page.getByText(NO_LONGER_LINKED)).toBeHidden();

    await page.waitForLoadState('networkidle');
    await accountRow(page, 'Instagram')
      .getByRole('button', { name: 'Disconnect' })
      .click();
    await expect(page.getByText('Account disconnected')).toBeVisible();
    await expect(page.getByText(NO_LONGER_LINKED)).toBeVisible();
    await page.reload();
    await expect(page.getByText(NO_LONGER_LINKED)).toBeVisible();
  });
});
