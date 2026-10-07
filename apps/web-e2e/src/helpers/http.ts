import { expect } from '@playwright/test';
import { BASE_URL } from '../env';

export const noRedirect = { maxRedirects: 0 } as const;

export const STACK_TRACE_PATTERN =
  /\n\s+at |\/var\/task|node_modules|\.next\/server|webpack-internal|PrismaClient/;

export const expectSameOrigin = (location: string | undefined) => {
  expect(location, 'The response has no Location header').toBeTruthy();

  const origin = new URL(BASE_URL).origin;
  expect(
    new URL(location!, BASE_URL).origin,
    `${location} leaves ${origin}`
  ).toBe(origin);
};

export const expectNoStackTrace = (body: string) => {
  expect(
    body.match(STACK_TRACE_PATTERN)?.[0],
    'The body has a stack trace or an internal path'
  ).toBeUndefined();
};
