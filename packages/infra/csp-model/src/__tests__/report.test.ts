import { describe, expect, it } from 'vitest';
import {
  CSP_REPORT_MAX_BYTES,
  CSP_REPORT_MAX_VIOLATIONS,
  parseCspReport
} from '../report';

const reportingApiReport = (body: Record<string, unknown>) => ({
  type: 'csp-violation',
  age: 0,
  url: 'https://www.giveaway.dog/browse',
  user_agent: 'Chrome',
  body
});

describe('limits', () => {
  it('accepts reports of up to 16 KB', () => {
    expect(CSP_REPORT_MAX_BYTES).toBe(16384);
  });

  it('keeps up to 10 violations of a report', () => {
    expect(CSP_REPORT_MAX_VIOLATIONS).toBe(10);
  });
});

describe('parseCspReport', () => {
  it('reads a report-uri report', () => {
    expect(
      parseCspReport({
        'csp-report': {
          'document-uri': 'https://www.giveaway.dog/browse',
          'violated-directive': 'script-src-elem',
          'effective-directive': 'script-src-elem',
          'blocked-uri': 'inline',
          'source-file': 'https://www.giveaway.dog/browse',
          'line-number': 12,
          disposition: 'report'
        }
      })
    ).toStrictEqual([
      {
        document: 'https://www.giveaway.dog/browse',
        directive: 'script-src-elem',
        blocked: 'inline',
        source: 'https://www.giveaway.dog/browse',
        line: 12,
        disposition: 'report'
      }
    ]);
  });

  it('falls back to the violated directive of a report-uri report', () => {
    expect(
      parseCspReport({
        'csp-report': {
          'document-uri': 'https://www.giveaway.dog/',
          'violated-directive': 'frame-src',
          'blocked-uri': 'https://evil.example/frame'
        }
      })
    ).toStrictEqual([
      {
        document: 'https://www.giveaway.dog/',
        directive: 'frame-src',
        blocked: 'https://evil.example/frame'
      }
    ]);
  });

  it('reads the CSP violations of a Reporting API report', () => {
    expect(
      parseCspReport([
        reportingApiReport({
          documentURL: 'https://www.giveaway.dog/app',
          effectiveDirective: 'connect-src',
          blockedURL: 'https://api.example.com/data',
          lineNumber: 3,
          disposition: 'enforce'
        }),
        { type: 'deprecation', body: { id: 'x' } },
        { type: 'csp-violation' }
      ])
    ).toStrictEqual([
      {
        document: 'https://www.giveaway.dog/app',
        directive: 'connect-src',
        blocked: 'https://api.example.com/data',
        line: 3,
        disposition: 'enforce'
      }
    ]);
  });

  it('drops the query and the fragment of each URL', () => {
    const [violation] = parseCspReport({
      'csp-report': {
        'document-uri':
          'https://www.giveaway.dog/invites/abc?token=secret#frag',
        'effective-directive': 'img-src',
        'blocked-uri': 'https://cdn.example.com/a.png?sig=secret',
        'source-file': 'https://www.giveaway.dog/a.js?v=1'
      }
    });

    expect(violation).toStrictEqual({
      document: 'https://www.giveaway.dog/invites/abc',
      directive: 'img-src',
      blocked: 'https://cdn.example.com/a.png',
      source: 'https://www.giveaway.dog/a.js'
    });
  });

  it('cuts each field to 200 characters', () => {
    const [violation] = parseCspReport({
      'csp-report': {
        'document-uri': `https://www.giveaway.dog/${'a'.repeat(300)}`,
        'effective-directive': 'x'.repeat(300),
        'blocked-uri': 'inline'
      }
    });

    expect(violation?.document).toHaveLength(200);
    expect(violation?.directive).toHaveLength(200);
  });

  it('keeps at most the first violations of a Reporting API report', () => {
    const reports = Array.from(
      { length: CSP_REPORT_MAX_VIOLATIONS + 5 },
      (_, index) =>
        reportingApiReport({
          documentURL: `https://www.giveaway.dog/${index}`,
          effectiveDirective: 'img-src',
          blockedURL: 'data'
        })
    );

    const violations = parseCspReport(reports);

    expect(violations).toHaveLength(CSP_REPORT_MAX_VIOLATIONS);
    expect(violations[0]?.document).toBe('https://www.giveaway.dog/0');
  });

  it('gives empty fields for a report without them', () => {
    expect(parseCspReport({ 'csp-report': {} })).toStrictEqual([
      { document: '', directive: '', blocked: '' }
    ]);
  });

  it.each([null, 'text', 42, { report: {} }, [{ body: {} }]])(
    'returns no violation for %j',
    (body) => {
      expect(parseCspReport(body)).toEqual([]);
    }
  );
});
