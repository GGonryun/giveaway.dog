import type { BrowserContext, Page } from '@playwright/test';

const EMPTY_SCRIPT_HOSTS = [
  'platform.twitter.com',
  'embed.bsky.app',
  'connect.facebook.net',
  'va.vercel-scripts.com'
];

const VERCEL_INSIGHTS_PATH = '/_vercel/insights/';

const AVATAR_HOST = 'avatar.vercel.sh';

const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

export const isEmptiedThirdParty = (url: URL) =>
  EMPTY_SCRIPT_HOSTS.includes(url.hostname) ||
  url.pathname.startsWith(VERCEL_INSIGHTS_PATH);

export const isStubbedAvatar = (url: URL) => url.hostname === AVATAR_HOST;

export const blockThirdParties = async (context: BrowserContext) => {
  await context.route(isEmptiedThirdParty, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: ''
    })
  );
  await context.route(isStubbedAvatar, (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG })
  );
};

export type PageErrorPattern = string | RegExp;

export const PAGE_ERROR_ALLOWLIST: PageErrorPattern[] = [];

const matches = (text: string, pattern: PageErrorPattern) =>
  typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text);

export const watchPageErrors = (
  context: BrowserContext,
  allowlist: PageErrorPattern[]
) => {
  const errors: string[] = [];

  const record = (kind: string, page: Page, text: string) => {
    if (allowlist.some((pattern) => matches(text, pattern))) return;
    errors.push(`${kind} on ${page.url()}: ${text}`);
  };

  const watch = (page: Page) => {
    page.on('pageerror', (error) =>
      record('Uncaught error', page, error.stack ?? error.message)
    );
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const { url } = message.location();
      record(
        'console.error',
        page,
        url ? `${message.text()} (${url})` : message.text()
      );
    });
  };

  context.pages().forEach(watch);
  context.on('page', watch);

  return errors;
};
