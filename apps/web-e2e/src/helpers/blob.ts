import type { Page, Route } from '@playwright/test';
import { BASE_URL } from '../env';

export const STUB_CLIENT_TOKEN = 'vercel_blob_client_e2e';

export const STUB_BLOB_URL = new URL('/logo.png', BASE_URL).href;

const BLOB_API_URL = 'https://vercel.com/api/blob';

const CORS_HEADERS = { 'access-control-allow-origin': '*' };

export type StubbedUpload = { pathname: string; url: string };

const isUploadRoute = (url: URL) =>
  url.origin === new URL(BASE_URL).origin && url.pathname === '/api/upload';

const isBlobApi = (url: URL) => url.href.startsWith(`${BLOB_API_URL}/`);

export const stubBlobUploads = async (
  page: Page,
  { url = STUB_BLOB_URL }: { url?: string } = {}
) => {
  const uploads: StubbedUpload[] = [];

  await page.route(isUploadRoute, async (route: Route) => {
    const event = route.request().postDataJSON();
    if (event?.type !== 'blob.generate-client-token') return route.fallback();

    await route.fulfill({
      json: {
        type: 'blob.generate-client-token',
        clientToken: STUB_CLIENT_TOKEN
      }
    });
  });

  await page.route(isBlobApi, async (route: Route) => {
    if (route.request().method() !== 'PUT') return route.abort();

    const pathname =
      new URL(route.request().url()).searchParams.get('pathname') ?? '';
    uploads.push({ pathname, url });

    await route.fulfill({
      headers: CORS_HEADERS,
      json: {
        url,
        downloadUrl: `${url}?download=1`,
        pathname,
        contentType: 'image/png',
        contentDisposition: `inline; filename="${pathname}"`
      }
    });
  });

  return uploads;
};
