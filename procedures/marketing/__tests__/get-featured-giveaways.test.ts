import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getFeaturedGiveaways from '../get-featured-giveaways';
import { nextCacheMock } from '@/test/next-cache';

const loadGiveaways = async () => {
  const promise = getFeaturedGiveaways();
  await vi.runAllTimersAsync();
  return promise;
};

const trackSettled = (promise: Promise<unknown>) => {
  const state = { settled: false };
  promise.then(() => {
    state.settled = true;
  });
  return state;
};

describe('getFeaturedGiveaways', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('caching and latency', () => {
    it('tags the cached result with featured-giveaways', async () => {
      await loadGiveaways();

      expect(nextCacheMock.cacheTag).toHaveBeenCalledWith('featured-giveaways');
    });

    it('waits at least 200ms when the random draw is at its minimum', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const promise = getFeaturedGiveaways();
      const state = trackSettled(promise);

      await vi.advanceTimersByTimeAsync(199);
      expect(state.settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(state.settled).toBe(true);
    });

    it('waits up to 1000ms when the random draw is at its maximum', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9999999);
      const promise = getFeaturedGiveaways();
      const state = trackSettled(promise);

      await vi.advanceTimersByTimeAsync(999);
      expect(state.settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(state.settled).toBe(true);
    });
  });

  describe('returned data', () => {
    it('returns the four featured giveaways in a fixed order', async () => {
      const giveaways = await loadGiveaways();

      expect(giveaways.map((giveaway) => giveaway.id)).toEqual([
        'featured_1',
        'featured_2',
        'featured_3',
        'featured_4'
      ]);
    });

    it('returns the expected titles, prize values, hosts and entry counts', async () => {
      const giveaways = await loadGiveaways();

      expect(
        giveaways.map((giveaway) => [
          giveaway.title,
          giveaway.prize.value,
          giveaway.host.name,
          giveaway.stats.entries
        ])
      ).toEqual([
        ['Ultimate Tech Bundle Giveaway', '$5,000', 'TechReviews Pro', 15420],
        ['Dream Vacation to Bali', '$8,500', 'Wanderlust Travel', 28904],
        ['Custom Gaming PC Build', '$4,200', 'Elite Gaming Builds', 9876],
        ['$10,000 Cash Prize Giveaway', '$10,000', 'Money Masters', 45231]
      ]);
    });

    it('marks every giveaway as featured with a verified host', async () => {
      const giveaways = await loadGiveaways();

      expect(giveaways.every((giveaway) => giveaway.featured)).toBe(true);
      expect(giveaways.every((giveaway) => giveaway.host.verified)).toBe(true);
    });

    it('marks only the gaming PC giveaway as ending soon', async () => {
      const giveaways = await loadGiveaways();

      expect(
        giveaways.map((giveaway) => [giveaway.id, giveaway.status])
      ).toEqual([
        ['featured_1', 'active'],
        ['featured_2', 'active'],
        ['featured_3', 'ending-soon'],
        ['featured_4', 'active']
      ]);
    });

    it('marks every giveaway except the Bali vacation as trending', async () => {
      const giveaways = await loadGiveaways();

      expect(giveaways.map((giveaway) => giveaway.trending)).toEqual([
        true,
        false,
        true,
        true
      ]);
    });

    it('gives every giveaway local image paths and a non-empty gallery', async () => {
      const giveaways = await loadGiveaways();

      for (const giveaway of giveaways) {
        expect(giveaway.prize.image).toMatch(/^\/images\/prizes\/.+\.jpg$/);
        expect(giveaway.host.avatar).toMatch(/^\/images\/hosts\/.+\.jpg$/);
        expect(giveaway.images.thumbnail).toMatch(/^\/images\/giveaways\//);
        expect(giveaway.images.banner).toMatch(/^\/images\/giveaways\//);
        expect(giveaway.images.gallery.length).toBeGreaterThan(0);
      }
    });

    it('accepts entries by email and from the US for every giveaway', async () => {
      const giveaways = await loadGiveaways();

      for (const giveaway of giveaways) {
        expect(giveaway.entryMethods).toContain('Email');
        expect(giveaway.eligibleCountries).toContain('US');
        expect(
          giveaway.eligibleCountries.every((code) => /^[A-Z]{2}$/.test(code))
        ).toBe(true);
      }
    });

    it('uses static end dates in early 2025 regardless of the current time', async () => {
      vi.setSystemTime(new Date('2030-01-01T00:00:00.000Z'));

      const giveaways = await loadGiveaways();

      expect(giveaways.map((giveaway) => giveaway.stats.endDate)).toEqual([
        '2025-01-25T23:59:59Z',
        '2025-02-02T23:59:59Z',
        '2025-01-22T23:59:59Z',
        '2025-02-08T23:59:59Z'
      ]);
      expect(giveaways[0].stats.timeLeft).toBe('5 days 12 hours');
    });

    it('returns a fresh array on each call', async () => {
      const first = await loadGiveaways();
      first[0].title = 'Mutated';

      const second = await loadGiveaways();

      expect(second).not.toBe(first);
      expect(second[0].title).toBe('Ultimate Tech Bundle Giveaway');
    });
  });
});
