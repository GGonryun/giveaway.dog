import { expect, test } from '../fixtures/test';
import { expectNoStackTrace } from '../helpers/http';

const QUEUE_ROUTES = [
  '/.well-known/workflow/v1/flow',
  '/.well-known/workflow/v1/step'
];

const BODIES: {
  name: string;
  headers?: Record<string, string>;
  data?: string;
}[] = [
  { name: 'no body' },
  {
    name: 'an empty JSON object',
    headers: { 'Content-Type': 'application/json' },
    data: '{}'
  },
  {
    name: 'a CloudEvent without its queue fields',
    headers: { 'Content-Type': 'application/cloudevents+json' },
    data: JSON.stringify({
      specversion: '1.0',
      type: 'com.vercel.queue.v1beta',
      source: 'e2e',
      id: 'e2e',
      data: {}
    })
  }
];

test.describe(
  'Workflow DevKit queue routes',
  { tag: ['@security', '@prod-safe'] },
  () => {
    for (const path of QUEUE_ROUTES) {
      for (const { name, headers, data } of BODIES) {
        test(`POST ${path} refuses ${name}`, async ({ request }) => {
          const response = await request.post(path, { headers, data });
          const body = await response.text();

          expect(response.status()).toBeGreaterThanOrEqual(400);
          expect(response.status()).toBeLessThan(500);
          expect(JSON.parse(body)).toEqual({ error: expect.any(String) });
          expectNoStackTrace(body);
        });
      }

      test(`GET ${path} is not a route`, async ({ request }) => {
        const response = await request.get(path);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
      });
    }
  }
);
