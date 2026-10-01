import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllRetweeters,
  getRetweeters,
  getRetweetersUntil,
  getRetweetersUntilUser
} from '../get-retweeters';

const m = vi.hoisted(() => ({
  getRetweeters: vi.fn(),
  ScrapeBadger: vi.fn()
}));

vi.mock('scrapebadger', () => ({
  ScrapeBadger: m.ScrapeBadger
}));

type TestUser = { id: string; username: string } | null;

const user = (id: string) => ({ id, username: `user${id}` });

const users = (from: number, count: number) =>
  Array.from({ length: count }, (_, index) => user(String(from + index)));

const page = (
  data: TestUser[] | null | undefined,
  options: { nextCursor?: string; hasMore?: boolean } = {}
) => ({ data, ...options });

const ids = (list: TestUser[]) => list.map((entry) => entry?.id ?? null);

describe('scrapebadger retweeter procedures', () => {
  beforeEach(() => {
    vi.stubEnv('SCRAPEBADGER_API_KEY', 'sb-key');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    m.getRetweeters.mockReset();
    m.ScrapeBadger.mockReset();
    m.ScrapeBadger.mockImplementation(function () {
      return { twitter: { tweets: { getRetweeters: m.getRetweeters } } };
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('getRetweeters', () => {
    it('requests a single page for the tweet with the given cursor', async () => {
      m.getRetweeters.mockResolvedValue(page([user('1')]));

      await getRetweeters({ tweetId: 't-1', cursor: 'c-1' });

      expect(m.ScrapeBadger).toHaveBeenCalledWith({ apiKey: 'sb-key' });
      expect(m.getRetweeters).toHaveBeenCalledWith('t-1', { cursor: 'c-1' });
    });

    it('passes an undefined cursor when none is given', async () => {
      m.getRetweeters.mockResolvedValue(page([]));

      await getRetweeters({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledWith('t-1', {
        cursor: undefined
      });
    });

    it('returns the raw API response', async () => {
      const response = page([user('1')], { nextCursor: 'c-2', hasMore: true });
      m.getRetweeters.mockResolvedValue(response);

      await expect(getRetweeters({ tweetId: 't-1' })).resolves.toBe(response);
    });

    it('rejects when the API key is missing', async () => {
      vi.stubEnv('SCRAPEBADGER_API_KEY', undefined);

      await expect(getRetweeters({ tweetId: 't-1' })).rejects.toThrow(
        'SCRAPEBADGER_API_KEY environment variable not set'
      );
    });
  });

  describe('getRetweetersUntil', () => {
    it('requests pages of 20 starting without a cursor', async () => {
      m.getRetweeters.mockResolvedValue(page([user('1')]));

      await getRetweetersUntil({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledWith('t-1', {
        cursor: undefined,
        count: 20
      });
    });

    it('starts from the given cursor', async () => {
      m.getRetweeters.mockResolvedValue(page([user('1')]));

      await getRetweetersUntil({ tweetId: 't-1', cursor: 'start' });

      expect(m.getRetweeters).toHaveBeenCalledWith('t-1', {
        cursor: 'start',
        count: 20
      });
    });

    it('returns a single page when there are no more results', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1'), user('2')], { hasMore: false })
      );

      const result = await getRetweetersUntil({ tweetId: 't-1' });

      expect(result).toEqual({
        users: [user('1'), user('2')],
        nextCursor: undefined,
        hasMore: false
      });
      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
    });

    it('follows the cursor across pages until there are no more results', async () => {
      m.getRetweeters
        .mockResolvedValueOnce(
          page([user('1')], { nextCursor: 'c-2', hasMore: true })
        )
        .mockResolvedValueOnce(
          page([user('2')], { nextCursor: 'c-3', hasMore: true })
        )
        .mockResolvedValueOnce(page([user('3')], { hasMore: false }));

      const result = await getRetweetersUntil({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenNthCalledWith(2, 't-1', {
        cursor: 'c-2',
        count: 20
      });
      expect(m.getRetweeters).toHaveBeenNthCalledWith(3, 't-1', {
        cursor: 'c-3',
        count: 20
      });
      expect(result).toEqual({
        users: [user('1'), user('2'), user('3')],
        nextCursor: undefined,
        hasMore: false
      });
    });

    it('stops when more results are reported without a cursor', async () => {
      m.getRetweeters.mockResolvedValue(page([user('1')], { hasMore: true }));

      const result = await getRetweetersUntil({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        users: [user('1')],
        nextCursor: undefined,
        hasMore: true
      });
    });

    it('stops after maxApiCalls pages and returns the next cursor', async () => {
      m.getRetweeters
        .mockResolvedValueOnce(
          page([user('1')], { nextCursor: 'c-2', hasMore: true })
        )
        .mockResolvedValueOnce(
          page([user('2')], { nextCursor: 'c-3', hasMore: true })
        );

      const result = await getRetweetersUntil({
        tweetId: 't-1',
        maxApiCalls: 2
      });

      expect(m.getRetweeters).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        users: [user('1'), user('2')],
        nextCursor: 'c-3',
        hasMore: true
      });
    });

    it('makes at most 10 API calls by default', async () => {
      let call = 0;
      m.getRetweeters.mockImplementation(async () => {
        call++;
        return page([user(String(call))], {
          nextCursor: `c-${call + 1}`,
          hasMore: true
        });
      });

      const result = await getRetweetersUntil({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledTimes(10);
      expect(result.users).toHaveLength(10);
      expect(result.nextCursor).toBe('c-11');
      expect(result.hasMore).toBe(true);
    });

    it('makes no API calls when maxApiCalls is 0', async () => {
      const result = await getRetweetersUntil({
        tweetId: 't-1',
        cursor: 'start',
        maxApiCalls: 0
      });

      expect(m.getRetweeters).not.toHaveBeenCalled();
      expect(result).toEqual({ users: [], nextCursor: 'start', hasMore: true });
    });

    it.each([null, undefined])(
      'treats %j page data as an empty page',
      async (data) => {
        m.getRetweeters.mockResolvedValue(page(data, { hasMore: false }));

        const result = await getRetweetersUntil({ tweetId: 't-1' });

        expect(result.users).toEqual([]);
      }
    );

    it('treats a missing hasMore flag as no more results', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1')], { nextCursor: 'c-2' })
      );

      const result = await getRetweetersUntil({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe('c-2');
    });

    it('keeps empty entries returned by the API', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1'), null], { hasMore: false })
      );

      const result = await getRetweetersUntil({ tweetId: 't-1' });

      expect(ids(result.users)).toEqual(['1', null]);
    });

    it('propagates API errors', async () => {
      m.getRetweeters.mockRejectedValue(new Error('rate limited'));

      await expect(getRetweetersUntil({ tweetId: 't-1' })).rejects.toThrow(
        'rate limited'
      );
    });
  });

  describe('getRetweetersUntilUser', () => {
    it('requests pages without a count starting from the given cursor', async () => {
      m.getRetweeters.mockResolvedValue(page([user('1')]));

      await getRetweetersUntilUser({ tweetId: 't-1', cursor: 'start' });

      expect(m.getRetweeters).toHaveBeenCalledWith('t-1', {
        cursor: 'start'
      });
    });

    it('collects every page when no stop user is given', async () => {
      m.getRetweeters
        .mockResolvedValueOnce(
          page([user('1'), user('2')], { nextCursor: 'c-2', hasMore: true })
        )
        .mockResolvedValueOnce(page([user('3')], { hasMore: false }));

      const result = await getRetweetersUntilUser({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenNthCalledWith(2, 't-1', {
        cursor: 'c-2'
      });
      expect(result).toEqual({
        users: [user('1'), user('2'), user('3')],
        nextCursor: undefined,
        hasMore: false
      });
    });

    it('returns only the users before the stop user', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1'), user('2'), user('3'), user('4')], {
          nextCursor: 'c-2',
          hasMore: true
        })
      );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        stopAtUserId: '3'
      });

      expect(result).toEqual({
        users: [user('1'), user('2')],
        nextCursor: undefined,
        hasMore: false
      });
      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
    });

    it('finds the stop user on a later page', async () => {
      m.getRetweeters
        .mockResolvedValueOnce(
          page([user('1'), user('2')], { nextCursor: 'c-2', hasMore: true })
        )
        .mockResolvedValueOnce(
          page([user('3'), user('4')], { nextCursor: 'c-3', hasMore: true })
        );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        stopAtUserId: '4'
      });

      expect(ids(result.users)).toEqual(['1', '2', '3']);
      expect(result.nextCursor).toBeUndefined();
      expect(result.hasMore).toBe(false);
      expect(m.getRetweeters).toHaveBeenCalledTimes(2);
    });

    it('returns no users when the stop user is the first retweeter', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1'), user('2')], { nextCursor: 'c-2', hasMore: true })
      );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        stopAtUserId: '1'
      });

      expect(result).toEqual({
        users: [],
        nextCursor: undefined,
        hasMore: false
      });
    });

    it('returns every user and the cursor state when the stop user is never found', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1'), user('2')], { hasMore: false })
      );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        stopAtUserId: '99'
      });

      expect(result).toEqual({
        users: [user('1'), user('2')],
        nextCursor: undefined,
        hasMore: false
      });
    });

    it('ignores an empty stop user id', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user(''), user('2')], { hasMore: false })
      );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        stopAtUserId: ''
      });

      expect(ids(result.users)).toEqual(['', '2']);
    });

    it('truncates to maxUsers when more pages remain', async () => {
      m.getRetweeters
        .mockResolvedValueOnce(
          page(users(1, 2), { nextCursor: 'c-2', hasMore: true })
        )
        .mockResolvedValueOnce(
          page(users(3, 2), { nextCursor: 'c-3', hasMore: true })
        );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        maxUsers: 3
      });

      expect(m.getRetweeters).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        users: users(1, 3),
        nextCursor: 'c-3',
        hasMore: true
      });
    });

    it('does not truncate to maxUsers on the final page', async () => {
      m.getRetweeters.mockResolvedValue(page(users(1, 5), { hasMore: false }));

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        maxUsers: 3
      });

      expect(result.users).toHaveLength(5);
    });

    it('does not truncate to maxUsers when the last page still has a cursor', async () => {
      m.getRetweeters.mockResolvedValue(
        page(users(1, 5), { nextCursor: 'c-2', hasMore: false })
      );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        maxUsers: 3
      });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        users: users(1, 5),
        nextCursor: 'c-2',
        hasMore: false
      });
    });

    it('stops at exactly maxUsers without requesting another page', async () => {
      m.getRetweeters.mockResolvedValue(
        page(users(1, 3), { nextCursor: 'c-2', hasMore: true })
      );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        maxUsers: 3
      });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        users: users(1, 3),
        nextCursor: 'c-2',
        hasMore: true
      });
    });

    it('propagates API errors', async () => {
      m.getRetweeters.mockRejectedValue(new Error('rate limited'));

      await expect(
        getRetweetersUntilUser({ tweetId: 't-1', stopAtUserId: '1' })
      ).rejects.toThrow('rate limited');
    });

    it('does not truncate to maxUsers when the stop user is found', async () => {
      m.getRetweeters.mockResolvedValue(
        page(users(1, 5), { nextCursor: 'c-2', hasMore: true })
      );

      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        stopAtUserId: '5',
        maxUsers: 2
      });

      expect(ids(result.users)).toEqual(['1', '2', '3', '4']);
    });

    it('collects at most 500 users by default', async () => {
      let call = 0;
      m.getRetweeters.mockImplementation(async () => {
        call++;
        return page(users(call * 100, 20), {
          nextCursor: `c-${call + 1}`,
          hasMore: true
        });
      });

      const result = await getRetweetersUntilUser({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledTimes(25);
      expect(result.users).toHaveLength(500);
      expect(result.nextCursor).toBe('c-26');
      expect(result.hasMore).toBe(true);
    });

    it('makes no API calls when maxUsers is 0', async () => {
      const result = await getRetweetersUntilUser({
        tweetId: 't-1',
        cursor: 'start',
        maxUsers: 0
      });

      expect(m.getRetweeters).not.toHaveBeenCalled();
      expect(result).toEqual({ users: [], nextCursor: 'start', hasMore: true });
    });

    it('stops when more results are reported without a cursor', async () => {
      m.getRetweeters.mockResolvedValue(page([user('1')], { hasMore: true }));

      const result = await getRetweetersUntilUser({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        users: [user('1')],
        nextCursor: undefined,
        hasMore: true
      });
    });

    it('removes empty entries from the result', async () => {
      m.getRetweeters.mockResolvedValue(
        page([null, user('1'), null, user('2')], { hasMore: false })
      );

      const result = await getRetweetersUntilUser({ tweetId: 't-1' });

      expect(ids(result.users)).toEqual(['1', '2']);
    });

    it.each([null, undefined])(
      'treats %j page data as an empty page',
      async (data) => {
        m.getRetweeters.mockResolvedValue(page(data, { hasMore: false }));

        const result = await getRetweetersUntilUser({
          tweetId: 't-1',
          stopAtUserId: '1'
        });

        expect(result.users).toEqual([]);
        expect(result.hasMore).toBe(false);
      }
    );
  });

  describe('getAllRetweeters', () => {
    it('fetches every page following the cursors', async () => {
      m.getRetweeters
        .mockResolvedValueOnce(
          page([user('1')], { nextCursor: 'c-2', hasMore: true })
        )
        .mockResolvedValueOnce(
          page([user('2')], { nextCursor: 'c-3', hasMore: true })
        )
        .mockResolvedValueOnce(page([user('3')], { hasMore: false }));

      const result = await getAllRetweeters({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenNthCalledWith(1, 't-1', {
        cursor: undefined
      });
      expect(m.getRetweeters).toHaveBeenNthCalledWith(2, 't-1', {
        cursor: 'c-2'
      });
      expect(m.getRetweeters).toHaveBeenNthCalledWith(3, 't-1', {
        cursor: 'c-3'
      });
      expect(result).toEqual([user('1'), user('2'), user('3')]);
    });

    it('stops when more results are reported without a cursor', async () => {
      m.getRetweeters.mockResolvedValue(page([user('1')], { hasMore: true }));

      const result = await getAllRetweeters({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
      expect(result).toEqual([user('1')]);
    });

    it('stops when the hasMore flag is missing even with a cursor', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1')], { nextCursor: 'c-2' })
      );

      await getAllRetweeters({ tweetId: 't-1' });

      expect(m.getRetweeters).toHaveBeenCalledTimes(1);
    });

    it('removes empty entries from the result', async () => {
      m.getRetweeters.mockResolvedValue(
        page([user('1'), null, user('2')], { hasMore: false })
      );

      const result = await getAllRetweeters({ tweetId: 't-1' });

      expect(ids(result)).toEqual(['1', '2']);
    });

    it.each([null, undefined])(
      'returns an empty list for %j page data',
      async (data) => {
        m.getRetweeters.mockResolvedValue(page(data, { hasMore: false }));

        await expect(getAllRetweeters({ tweetId: 't-1' })).resolves.toEqual([]);
      }
    );

    it('propagates API errors', async () => {
      m.getRetweeters.mockRejectedValue(new Error('rate limited'));

      await expect(getAllRetweeters({ tweetId: 't-1' })).rejects.toThrow(
        'rate limited'
      );
    });
  });
});
