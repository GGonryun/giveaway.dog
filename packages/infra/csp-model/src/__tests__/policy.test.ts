import { describe, expect, it } from 'vitest';
import {
  CSP_CONNECT_SOURCES,
  CSP_FRAME_SOURCES,
  CSP_MODE,
  CSP_REPORT_PATH,
  NONCE_HEADER,
  buildContentSecurityPolicy,
  cspHeaderName,
  newNonce
} from '../policy';

const directives = (policy: string) =>
  new Map(
    policy.split('; ').map((directive) => {
      const [name, ...sources] = directive.split(' ');
      return [name, sources] as const;
    })
  );

const production = directives(
  buildContentSecurityPolicy({ nonce: 'abc123', development: false })
);

describe('the allowed hosts', () => {
  it('lists the frames of Turnstile and the social embeds', () => {
    expect(CSP_FRAME_SOURCES).toEqual([
      'https://challenges.cloudflare.com',
      'https://platform.twitter.com',
      'https://syndication.twitter.com',
      'https://embed.bsky.app',
      'https://www.facebook.com',
      'https://web.facebook.com',
      'https://www.tiktok.com'
    ]);
  });

  it('lists the requests of the Blob uploads and the embeds', () => {
    expect(CSP_CONNECT_SOURCES).toEqual([
      'https://vercel.com',
      'https://*.public.blob.vercel-storage.com',
      'https://challenges.cloudflare.com',
      'https://www.tiktok.com',
      'https://syndication.twitter.com',
      'https://cdn.syndication.twimg.com',
      'https://connect.facebook.net',
      'https://*.facebook.com'
    ]);
  });
});

describe('buildContentSecurityPolicy', () => {
  it('builds the whole policy', () => {
    expect(
      buildContentSecurityPolicy({ nonce: 'abc123', development: false })
    ).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'nonce-abc123' 'strict-dynamic' https: 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' blob: data: https:",
        "font-src 'self' data:",
        "media-src 'self' blob: https:",
        `connect-src 'self' ${CSP_CONNECT_SOURCES.join(' ')}`,
        `frame-src 'self' ${CSP_FRAME_SOURCES.join(' ')}`,
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
        'report-uri /api/csp-report'
      ].join('; ')
    );
  });

  it('lists each directive once', () => {
    const policy = buildContentSecurityPolicy({
      nonce: 'abc123',
      development: false
    });

    expect(production.size).toBe(policy.split('; ').length);
  });

  it('allows scripts only with the nonce of the request and the scripts they load', () => {
    expect(production.get('script-src')).toEqual([
      "'self'",
      "'nonce-abc123'",
      "'strict-dynamic'",
      'https:',
      "'unsafe-inline'"
    ]);
  });

  it('allows eval only in development', () => {
    const development = directives(
      buildContentSecurityPolicy({ nonce: 'abc123', development: true })
    );

    expect(production.get('script-src')).not.toContain("'unsafe-eval'");
    expect(development.get('script-src')).toContain("'unsafe-eval'");
  });

  it('blocks plugins, base changes and framing by other sites', () => {
    expect(production.get('object-src')).toEqual(["'none'"]);
    expect(production.get('base-uri')).toEqual(["'self'"]);
    expect(production.get('frame-ancestors')).toEqual(["'self'"]);
    expect(production.get('form-action')).toEqual(["'self'"]);
    expect(production.get('default-src')).toEqual(["'self'"]);
  });

  it('keeps inline styles, which Radix and the charts set', () => {
    expect(production.get('style-src')).toEqual(["'self'", "'unsafe-inline'"]);
  });

  it('allows the frames of Turnstile and the social embeds', () => {
    expect(production.get('frame-src')).toEqual([
      "'self'",
      ...CSP_FRAME_SOURCES
    ]);
    expect(CSP_FRAME_SOURCES).toEqual(
      expect.arrayContaining([
        'https://challenges.cloudflare.com',
        'https://platform.twitter.com',
        'https://embed.bsky.app',
        'https://www.facebook.com',
        'https://www.tiktok.com'
      ])
    );
  });

  it('allows the requests of the Blob uploads and the embeds', () => {
    expect(production.get('connect-src')).toEqual([
      "'self'",
      ...CSP_CONNECT_SOURCES
    ]);
    expect(CSP_CONNECT_SOURCES).toEqual(
      expect.arrayContaining([
        'https://vercel.com',
        'https://*.public.blob.vercel-storage.com',
        'https://www.tiktok.com'
      ])
    );
  });

  it('allows images from any HTTPS host, data and blob URLs', () => {
    expect(production.get('img-src')).toEqual([
      "'self'",
      'blob:',
      'data:',
      'https:'
    ]);
  });

  it('sends the reports to the report route', () => {
    expect(production.get('report-uri')).toEqual([CSP_REPORT_PATH]);
    expect(CSP_REPORT_PATH).toBe('/api/csp-report');
  });
});

describe('cspHeaderName', () => {
  it('names the enforcing header', () => {
    expect(cspHeaderName('enforce')).toBe('Content-Security-Policy');
  });

  it('names the report-only header', () => {
    expect(cspHeaderName('report-only')).toBe(
      'Content-Security-Policy-Report-Only'
    );
  });

  it('reports only until the reports from real traffic are clean', () => {
    expect(CSP_MODE).toBe('report-only');
  });
});

describe('NONCE_HEADER', () => {
  it('names the request header that carries the nonce to the render', () => {
    expect(NONCE_HEADER).toBe('x-nonce');
  });
});

describe('newNonce', () => {
  it('returns a new base64 value each time', () => {
    const first = newNonce();
    const second = newNonce();

    expect(first).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(atob(first)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(second).not.toBe(first);
  });
});
