import { expect, type APIResponse } from '@playwright/test';

export const INTEGRATION_IDS = [
  'x',
  'bluesky',
  'discord',
  'youtube',
  'twitch',
  'tiktok',
  'reddit',
  'spotify',
  'instagram',
  'facebook',
  'steam',
  'linkedin',
  'github',
  'patreon',
  'producthunt',
  'coinbase',
  'kick',
  'snapchat',
  'threads',
  'pinterest',
  'tumblr',
  'velora',
  'google'
];

export type PublicPage = {
  path: string;
  // A page without a heading shows this text instead.
  text?: string;
};

export const PUBLIC_PAGES: PublicPage[] = [
  { path: '/' },
  { path: '/home' },
  { path: '/pricing' },
  { path: '/contact' },
  { path: '/examples', text: 'Coming Soon' },
  { path: '/apps' },
  { path: '/privacy' },
  { path: '/terms' },
  { path: '/learn/integrations' },
  ...INTEGRATION_IDS.map((id) => ({ path: `/learn/integrations/${id}` })),
  { path: '/learn/templates' },
  { path: '/winners' },
  // The search runs the second raw SQL query of the leaderboard.
  { path: '/winners?search=zzz' },
  { path: '/history' },
  { path: '/history?search=zzz' },
  { path: '/browse' },
  { path: '/pickers/x' },
  { path: '/user/verify' },
  { path: '/demo/sweepstakes' },
  { path: '/login', text: 'Connect with us' }
];

export const NOT_FOUND_PAGES = [
  '/does-not-exist',
  '/learn/integrations/myspace',
  '/pickers/x/does-not-exist',
  '/learn/templates/does-not-exist'
];

// Pages print these with HTTP status 200 when a procedure fails.
export const ERROR_MARKERS = [
  '[ERROR-',
  'Application error',
  'Error loading',
  'Failed to load'
];

export const findErrorMarkers = (body: string) =>
  ERROR_MARKERS.filter((marker) => body.includes(marker));

export const expectNoErrorMarkers = async (response: APIResponse) => {
  expect(
    findErrorMarkers(await response.text()),
    `${response.url()} shows an error`
  ).toEqual([]);
};
