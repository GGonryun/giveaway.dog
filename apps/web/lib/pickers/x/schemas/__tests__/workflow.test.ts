import { describe, it, expect } from 'vitest';
import {
  twitterScrapeProgress,
  twitterScrapeRequest,
  twitterScrapeWorkflowInput
} from '../workflow';

describe('twitterScrapeProgress', () => {
  const progress = {
    current: 10,
    max: 100,
    progress: 10,
    status: 'PROCESSING'
  };

  it('accepts a valid progress update', () => {
    expect(twitterScrapeProgress.parse(progress)).toEqual(progress);
  });

  it('accepts a progress update without a maximum', () => {
    expect(
      twitterScrapeProgress.safeParse({ ...progress, max: undefined }).success
    ).toBe(true);
  });

  it.each([0, 100])('accepts the boundary progress %i', (value) => {
    expect(
      twitterScrapeProgress.safeParse({ ...progress, progress: value }).success
    ).toBe(true);
  });

  it.each([-1, 101])('rejects the out of range progress %i', (value) => {
    expect(
      twitterScrapeProgress.safeParse({ ...progress, progress: value }).success
    ).toBe(false);
  });

  it('rejects a negative current count', () => {
    expect(
      twitterScrapeProgress.safeParse({ ...progress, current: -1 }).success
    ).toBe(false);
  });

  it('rejects a negative maximum', () => {
    expect(
      twitterScrapeProgress.safeParse({ ...progress, max: -1 }).success
    ).toBe(false);
  });

  it('rejects an unknown status', () => {
    expect(
      twitterScrapeProgress.safeParse({ ...progress, status: 'RUNNING' })
        .success
    ).toBe(false);
  });
});

describe('twitterScrapeWorkflowInput', () => {
  it('accepts tweet ids and a picker id', () => {
    expect(
      twitterScrapeWorkflowInput.parse({
        tweetIds: ['1', '2'],
        pickerId: 'picker-1'
      })
    ).toEqual({ tweetIds: ['1', '2'], pickerId: 'picker-1' });
  });

  it('accepts an empty tweet id list', () => {
    expect(
      twitterScrapeWorkflowInput.safeParse({ tweetIds: [], pickerId: 'p' })
        .success
    ).toBe(true);
  });

  it('coerces a run date string into a Date', () => {
    expect(
      twitterScrapeWorkflowInput.parse({
        tweetIds: ['1'],
        pickerId: 'picker-1',
        runDate: '2025-06-20T00:00:00.000Z'
      }).runDate
    ).toEqual(new Date('2025-06-20T00:00:00.000Z'));
  });

  it('rejects an empty tweet id', () => {
    expect(
      twitterScrapeWorkflowInput.safeParse({ tweetIds: [''], pickerId: 'p' })
        .success
    ).toBe(false);
  });

  it('rejects an empty picker id', () => {
    expect(
      twitterScrapeWorkflowInput.safeParse({ tweetIds: ['1'], pickerId: '' })
        .success
    ).toBe(false);
  });

  it('rejects an invalid run date', () => {
    expect(
      twitterScrapeWorkflowInput.safeParse({
        tweetIds: ['1'],
        pickerId: 'p',
        runDate: 'soon'
      }).success
    ).toBe(false);
  });
});

describe('twitterScrapeRequest', () => {
  const data = {
    setup: { postUrls: [{ url: 'https://x.com/doglover/status/1111' }] },
    actions: {},
    winners: {},
    filters: {}
  };

  it('accepts a request and applies the form defaults', () => {
    const parsed = twitterScrapeRequest.parse({
      pickerId: 'picker-1',
      slug: 'acme',
      data
    });

    expect(parsed.data.winners).toEqual({ quota: 1 });
    expect(parsed.data.actions).toEqual({ repost: true, reply: false });
  });

  it('does not validate the run date window', () => {
    expect(
      twitterScrapeRequest.safeParse({
        pickerId: 'picker-1',
        slug: 'acme',
        data: {
          ...data,
          timing: { runAt: '2000-01-01T00:00:00.000Z', timeZone: 'UTC' }
        }
      }).success
    ).toBe(true);
  });

  it('rejects an empty slug', () => {
    expect(
      twitterScrapeRequest.safeParse({ pickerId: 'picker-1', slug: '', data })
        .success
    ).toBe(false);
  });

  it('rejects an empty picker id', () => {
    expect(
      twitterScrapeRequest.safeParse({ pickerId: '', slug: 'acme', data })
        .success
    ).toBe(false);
  });

  it('rejects invalid form data', () => {
    expect(
      twitterScrapeRequest.safeParse({
        pickerId: 'picker-1',
        slug: 'acme',
        data: { ...data, setup: { postUrls: [] } }
      }).success
    ).toBe(false);
  });
});
