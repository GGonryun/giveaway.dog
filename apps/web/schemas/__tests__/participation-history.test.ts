import { describe, it, expect } from 'vitest';
import {
  participationHistoryItemSchema,
  participationHistorySchema
} from '../participation-history';

const item = {
  sweepstakesId: 'sweep-1',
  sweepstakesName: 'Summer Giveaway',
  sweepstakesStartDate: '2026-06-01T00:00:00.000Z',
  sweepstakesEndDate: '2026-06-30T00:00:00.000Z',
  engagement: 0.5,
  totalTasks: 4,
  completedTasks: 2,
  lastParticipatedAt: '2026-06-05T00:00:00.000Z',
  banner: null,
  sweepstakesStatus: 'RUNNING',
  hasWon: false
};

describe('participationHistoryItemSchema', () => {
  it('coerces the sweepstakes dates but keeps lastParticipatedAt a string', () => {
    const parsed = participationHistoryItemSchema.parse(item);

    expect(parsed.sweepstakesStartDate).toEqual(
      new Date('2026-06-01T00:00:00.000Z')
    );
    expect(parsed.sweepstakesEndDate).toEqual(
      new Date('2026-06-30T00:00:00.000Z')
    );
    expect(parsed.lastParticipatedAt).toBe('2026-06-05T00:00:00.000Z');
  });

  it('accepts a banner URL', () => {
    expect(
      participationHistoryItemSchema.parse({ ...item, banner: 'b.png' }).banner
    ).toBe('b.png');
  });

  it.each(['DRAFT', 'COMPLETED', 'RUNNING', 'SCHEDULED', 'EXPIRED', 'ERROR'])(
    'accepts the derived status %s',
    (sweepstakesStatus) => {
      expect(
        participationHistoryItemSchema.safeParse({ ...item, sweepstakesStatus })
          .success
      ).toBe(true);
    }
  );

  it('rejects the raw ACTIVE status', () => {
    expect(
      participationHistoryItemSchema.safeParse({
        ...item,
        sweepstakesStatus: 'ACTIVE'
      }).success
    ).toBe(false);
  });

  it('rejects a Date for lastParticipatedAt', () => {
    expect(
      participationHistoryItemSchema.safeParse({
        ...item,
        lastParticipatedAt: new Date()
      }).success
    ).toBe(false);
  });

  it('rejects an unparseable start date', () => {
    const result = participationHistoryItemSchema.safeParse({
      ...item,
      sweepstakesStartDate: 'soon'
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['sweepstakesStartDate']);
  });

  it('requires hasWon', () => {
    const result = participationHistoryItemSchema.safeParse({
      ...item,
      hasWon: undefined
    });

    expect(result.success).toBe(false);
  });
});

describe('participationHistorySchema', () => {
  it('accepts an empty history', () => {
    expect(participationHistorySchema.parse([])).toEqual([]);
  });

  it('parses every item', () => {
    const parsed = participationHistorySchema.parse([
      item,
      { ...item, sweepstakesId: 'sweep-2', hasWon: true }
    ]);

    expect(parsed.map((entry) => entry.sweepstakesId)).toEqual([
      'sweep-1',
      'sweep-2'
    ]);
  });

  it('reports the index of an invalid item', () => {
    const result = participationHistorySchema.safeParse([
      item,
      { ...item, engagement: 'high' }
    ]);

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([1, 'engagement']);
  });
});
