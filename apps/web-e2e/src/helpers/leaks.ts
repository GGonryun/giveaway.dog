import { expect, type APIRequestContext } from '@playwright/test';
import { noRedirect } from './http';

type Payload = {
  kind: string;
  headers: Record<string, string>;
  contentType: string;
};

const PAYLOADS: Payload[] = [
  { kind: 'HTML', headers: {}, contentType: 'text/html' },
  {
    kind: 'RSC payload',
    headers: { RSC: '1' },
    contentType: 'text/x-component'
  }
];

export const expectNotInPayload = async (
  request: APIRequestContext,
  url: string,
  secrets: Record<string, string>
) => {
  for (const [name, value] of Object.entries(secrets)) {
    if (!value) throw new Error(`The secret "${name}" is empty`);
  }

  for (const payload of PAYLOADS) {
    const response = await request.get(url, {
      ...noRedirect,
      headers: payload.headers
    });
    expect(response.status(), `GET ${url} (${payload.kind})`).toBe(200);
    expect(response.headers()['content-type']).toContain(payload.contentType);

    const body = await response.text();
    for (const [name, value] of Object.entries(secrets)) {
      expect(
        body.includes(value),
        `The ${payload.kind} of ${url} contains ${name}`
      ).toBe(false);
    }
  }
};
