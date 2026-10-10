import type { APIRequestContext } from '@playwright/test';
import type { E2eOutboxEntry } from '@giveaway/e2e-model/fakes';
import { expect } from '../fixtures/test';
import { expectSameOrigin } from './http';
import { seedApi, type SeedHealth } from './seed';

export type OutboxEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export const fakesOf = (health: SeedHealth | undefined) => health?.fakes ?? [];

export const waitForEmail = async (
  request: APIRequestContext,
  to: string,
  subject: RegExp
): Promise<OutboxEmail> => {
  let found: E2eOutboxEntry | undefined;
  await expect
    .poll(
      async () => {
        const entries = await seedApi(request).outbox({
          channel: 'email',
          target: to
        });
        found = entries.findLast((entry) =>
          subject.test(String(entry.payload.subject))
        );
        return found !== undefined;
      },
      { message: `No email to ${to} with the subject ${subject}` }
    )
    .toBe(true);
  return found!.payload as OutboxEmail;
};

const decodeHtml = (value: string) =>
  value.replaceAll('&amp;', '&').replaceAll('&quot;', '"');

export const linkInEmail = (email: OutboxEmail, path: string) => {
  const links = [...email.html.matchAll(/href="([^"]+)"/g)].map((match) =>
    decodeHtml(match[1])
  );
  const link = links.find((href) => new URL(href).pathname.startsWith(path));
  expect(link, `The email has no link to ${path}`).toBeTruthy();
  expectSameOrigin(link);
  return link!;
};
