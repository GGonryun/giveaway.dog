import { describe, it, expect, vi, afterEach } from 'vitest';
import { toSweepstakesSlug, toSweepstakesUrl } from '../util';

type SweepstakesArg = Parameters<typeof toSweepstakesSlug>[0];

const sweepstakes = (slug: string | null | undefined): SweepstakesArg =>
  ({
    id: 'sw-1',
    visibility: slug === undefined ? null : { slug }
  }) as SweepstakesArg;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('toSweepstakesSlug', () => {
  it('returns the visibility slug when one is set', () => {
    expect(toSweepstakesSlug(sweepstakes('summer-giveaway'))).toBe(
      'summer-giveaway'
    );
  });

  it('falls back to the id when the slug is null', () => {
    expect(toSweepstakesSlug(sweepstakes(null))).toBe('sw-1');
  });

  it('falls back to the id when there is no visibility record', () => {
    expect(toSweepstakesSlug(sweepstakes(undefined))).toBe('sw-1');
  });

  it('keeps an empty string slug instead of falling back to the id', () => {
    expect(toSweepstakesSlug(sweepstakes(''))).toBe('');
  });
});

describe('toSweepstakesUrl', () => {
  it('uses NEXT_PUBLIC_APP_URL as the base by default', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview.giveaway.dog');

    expect(toSweepstakesUrl({ sweepstakes: sweepstakes('promo') })).toBe(
      'https://preview.giveaway.dog/browse/promo'
    );
  });

  it('uses NEXT_PUBLIC_APP_URL when forcePath is false', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

    expect(
      toSweepstakesUrl({ sweepstakes: sweepstakes(null), forcePath: false })
    ).toBe('http://localhost:3000/browse/sw-1');
  });

  it('uses the production domain when forcePath is true', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');

    expect(
      toSweepstakesUrl({ sweepstakes: sweepstakes('promo'), forcePath: true })
    ).toBe('https://giveaway.dog/browse/promo');
  });

  it('renders "undefined" as the base when NEXT_PUBLIC_APP_URL is not set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);

    expect(toSweepstakesUrl({ sweepstakes: sweepstakes('promo') })).toBe(
      'undefined/browse/promo'
    );
  });
});
