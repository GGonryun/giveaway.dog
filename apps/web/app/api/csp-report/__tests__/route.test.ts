import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CSP_REPORT_MAX_BYTES } from '@giveaway/csp-model/report';
import { POST } from '../route';

const report = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost:3000/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': 'application/csp-report', ...headers },
    body
  });

describe('POST /api/csp-report', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('logs each violation of a report and answers 204', async () => {
    const response = await POST(
      report(
        JSON.stringify({
          'csp-report': {
            'document-uri': 'https://www.giveaway.dog/browse?q=1',
            'effective-directive': 'script-src-elem',
            'blocked-uri': 'inline'
          }
        })
      )
    );

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[csp]',
      JSON.stringify({
        document: 'https://www.giveaway.dog/browse',
        directive: 'script-src-elem',
        blocked: 'inline'
      })
    );
  });

  it('logs each CSP violation of a Reporting API report', async () => {
    const response = await POST(
      report(
        JSON.stringify([
          {
            type: 'csp-violation',
            body: {
              documentURL: 'https://www.giveaway.dog/',
              effectiveDirective: 'frame-src',
              blockedURL: 'https://evil.example/'
            }
          },
          {
            type: 'csp-violation',
            body: {
              documentURL: 'https://www.giveaway.dog/app',
              effectiveDirective: 'img-src',
              blockedURL: 'data'
            }
          }
        ]),
        { 'content-type': 'application/reports+json' }
      )
    );

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('answers 204 and logs nothing for JSON that is not a report', async () => {
    const response = await POST(report(JSON.stringify({ hello: 'world' })));

    expect(response.status).toBe(204);
    expect(warn).not.toHaveBeenCalled();
  });

  it('refuses a body that is not JSON', async () => {
    const response = await POST(report('not json'));

    expect(response.status).toBe(400);
    expect(warn).not.toHaveBeenCalled();
  });

  it('refuses a body that declares more than the limit', async () => {
    const response = await POST(
      report('{}', { 'content-length': String(CSP_REPORT_MAX_BYTES + 1) })
    );

    expect(response.status).toBe(413);
    expect(warn).not.toHaveBeenCalled();
  });

  it('refuses a body longer than the limit', async () => {
    const response = await POST(
      report(JSON.stringify({ padding: 'a'.repeat(CSP_REPORT_MAX_BYTES) }))
    );

    expect(response.status).toBe(413);
    expect(warn).not.toHaveBeenCalled();
  });
});
