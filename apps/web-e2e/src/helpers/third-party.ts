import type { BrowserContext, Page, Request } from '@playwright/test';

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

const NOTABLE_HEADERS = [
  'next-action',
  'rsc',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'sec-purpose',
  'purpose'
];

const describeRequest = (request: Request) => {
  const headers = request.headers();
  const notable = NOTABLE_HEADERS.filter((name) => headers[name] !== undefined)
    .map((name) => `${name}: ${headers[name]}`)
    .join(', ');
  return `${request.method()} ${request.resourceType()}${notable ? `, ${notable}` : ''}`;
};

type PageError = { kind: string; pageUrl: string; text: string; url?: string };

export const watchPageErrors = (
  context: BrowserContext,
  allowlist: PageErrorPattern[]
) => {
  const errors: PageError[] = [];
  const failedRequests = new Map<string, string>();

  const record = (error: PageError) => {
    if (allowlist.some((pattern) => matches(error.text, pattern))) return;
    errors.push(error);
  };

  const watch = (page: Page) => {
    page.on('pageerror', (error) =>
      record({
        kind: 'Uncaught error',
        pageUrl: page.url(),
        text: error.stack ?? error.message
      })
    );
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      record({
        kind: 'console.error',
        pageUrl: page.url(),
        text: message.text(),
        url: message.location().url || undefined
      });
    });
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.set(response.url(), describeRequest(response.request()));
      }
    });
  };

  context.pages().forEach(watch);
  context.on('page', watch);

  return () =>
    errors.map(({ kind, pageUrl, text, url }) => {
      const request = url && failedRequests.get(url);
      const source = url ? ` (${request ? `${request} ` : ''}${url})` : '';
      return `${kind} on ${pageUrl}: ${text}${source}`;
    });
};
