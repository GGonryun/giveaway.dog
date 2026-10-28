import { expect, test } from '../fixtures/test';
import { noRedirect } from '../helpers/http';
import { TAGS } from '../helpers/tags';

const PAGES = ['/', '/browse', '/login'];

const policyOf = (headers: Record<string, string>) =>
  headers['content-security-policy'] ??
  headers['content-security-policy-report-only'];

const nonceOf = (policy: string | undefined) =>
  policy?.match(/'nonce-([^']+)'/)?.[1];

const scriptTags = (html: string) =>
  [...html.matchAll(/<script\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => !/type="application\/(ld\+)?json"/.test(tag));

test.describe('content security policy', { tag: TAGS.security }, () => {
  for (const path of PAGES) {
    test(
      `GET ${path} sends a policy with a nonce on every script`,
      { tag: TAGS.prodSafe },
      async ({ request }) => {
        const response = await request.get(path, noRedirect);
        const policy = policyOf(response.headers());
        const nonce = nonceOf(policy);

        expect(response.status()).toBe(200);
        expect(policy, 'No Content-Security-Policy header').toBeTruthy();
        expect(nonce, 'No nonce in the policy').toBeTruthy();
        expect(policy).toContain("'strict-dynamic'");
        expect(policy).toContain("object-src 'none'");
        expect(policy).toContain("base-uri 'self'");
        expect(policy).toContain("frame-ancestors 'self'");
        expect(policy).toContain('report-uri /api/csp-report');

        const tags = scriptTags(await response.text());
        expect(tags.length).toBeGreaterThan(0);
        expect(
          tags.filter((tag) => !tag.includes(`nonce="${nonce}"`)),
          'Scripts without the nonce of the request'
        ).toEqual([]);
      }
    );
  }

  test(
    'each response gets its own nonce',
    { tag: TAGS.prodSafe },
    async ({ request }) => {
      const first = nonceOf(policyOf((await request.get('/')).headers()));
      const second = nonceOf(policyOf((await request.get('/')).headers()));

      expect(first).toBeTruthy();
      expect(second).toBeTruthy();
      expect(second).not.toBe(first);
    }
  );

  test('the report route accepts a violation report', async ({ request }) => {
    const response = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/csp-report' },
      data: JSON.stringify({
        'csp-report': {
          'document-uri': '/e2e',
          'effective-directive': 'script-src-elem',
          'blocked-uri': 'inline'
        }
      })
    });

    expect(response.status()).toBe(204);
  });

  test('the report route refuses a body that is not JSON', async ({
    request
  }) => {
    const response = await request.post('/api/csp-report', {
      headers: { 'content-type': 'application/csp-report' },
      data: '{'
    });

    expect(response.status()).toBe(400);
  });
});
