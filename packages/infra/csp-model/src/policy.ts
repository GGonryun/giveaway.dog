export type CspMode = 'report-only' | 'enforce';

export const CSP_MODE: CspMode = 'report-only';

export const CSP_REPORT_PATH = '/api/csp-report';

export const NONCE_HEADER = 'x-nonce';

export const CSP_FRAME_SOURCES = [
  'https://challenges.cloudflare.com',
  'https://platform.twitter.com',
  'https://syndication.twitter.com',
  'https://embed.bsky.app',
  'https://www.facebook.com',
  'https://web.facebook.com',
  'https://www.tiktok.com'
];

export const CSP_CONNECT_SOURCES = [
  'https://vercel.com',
  'https://*.public.blob.vercel-storage.com',
  'https://challenges.cloudflare.com',
  'https://www.tiktok.com',
  'https://syndication.twitter.com',
  'https://cdn.syndication.twimg.com',
  'https://connect.facebook.net',
  'https://*.facebook.com'
];

export const cspHeaderName = (mode: CspMode) =>
  mode === 'enforce'
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';

export const newNonce = () => btoa(crypto.randomUUID());

export const buildContentSecurityPolicy = ({
  nonce,
  development
}: {
  nonce: string;
  development: boolean;
}) => {
  const directives: [string, ...string[]][] = [
    ['default-src', "'self'"],
    [
      'script-src',
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      'https:',
      "'unsafe-inline'",
      ...(development ? ["'unsafe-eval'"] : [])
    ],
    ['style-src', "'self'", "'unsafe-inline'"],
    ['img-src', "'self'", 'blob:', 'data:', 'https:'],
    ['font-src', "'self'", 'data:'],
    ['media-src', "'self'", 'blob:', 'https:'],
    ['connect-src', "'self'", ...CSP_CONNECT_SOURCES],
    ['frame-src', "'self'", ...CSP_FRAME_SOURCES],
    ['worker-src', "'self'", 'blob:'],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
    ['frame-ancestors', "'self'"],
    ['report-uri', CSP_REPORT_PATH]
  ];

  return directives.map((directive) => directive.join(' ')).join('; ');
};
