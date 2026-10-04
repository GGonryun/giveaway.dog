import { describe, it, expect } from 'vitest';
import {
  listPickersV2FilterSchema,
  pickersV2ListItemSchema,
  pickersV2ListSchema,
  toPickersV2Filter
} from '../list';

const item = {
  pickerId: 'picker-1',
  status: 'COMPLETE',
  type: 'TWITTER',
  updatedAt: '2025-01-02T00:00:00.000Z',
  name: 'My Picker'
};

describe('pickersV2ListItemSchema', () => {
  it('coerces the updated date into a Date', () => {
    expect(pickersV2ListItemSchema.parse(item)).toEqual({
      ...item,
      updatedAt: new Date('2025-01-02T00:00:00.000Z')
    });
  });

  it('accepts a Bluesky picker type', () => {
    expect(
      pickersV2ListItemSchema.safeParse({ ...item, type: 'BLUESKY' }).success
    ).toBe(true);
  });

  it('rejects the ALL filter as an item status', () => {
    expect(
      pickersV2ListItemSchema.safeParse({ ...item, status: 'ALL' }).success
    ).toBe(false);
  });

  it('rejects an unknown picker type', () => {
    expect(
      pickersV2ListItemSchema.safeParse({ ...item, type: 'INSTAGRAM' }).success
    ).toBe(false);
  });

  it('rejects an invalid updated date', () => {
    expect(
      pickersV2ListItemSchema.safeParse({ ...item, updatedAt: 'yesterday' })
        .success
    ).toBe(false);
  });
});

describe('pickersV2ListSchema', () => {
  it('accepts an empty list', () => {
    expect(pickersV2ListSchema.parse({ pickers: [] })).toEqual({ pickers: [] });
  });

  it('validates every item', () => {
    expect(
      pickersV2ListSchema.safeParse({ pickers: [item, { pickerId: 'x' }] })
        .success
    ).toBe(false);
  });

  it('requires the pickers array', () => {
    expect(pickersV2ListSchema.safeParse({}).success).toBe(false);
  });
});

describe('listPickersV2FilterSchema', () => {
  it('accepts an empty filter', () => {
    expect(listPickersV2FilterSchema.parse({})).toEqual({});
  });

  it('accepts the ALL status', () => {
    expect(listPickersV2FilterSchema.parse({ status: 'ALL' })).toEqual({
      status: 'ALL'
    });
  });

  it('accepts a database status', () => {
    expect(listPickersV2FilterSchema.parse({ status: 'DRAFT' })).toEqual({
      status: 'DRAFT'
    });
  });

  it('rejects an unknown status', () => {
    expect(
      listPickersV2FilterSchema.safeParse({ status: 'archived' }).success
    ).toBe(false);
  });
});

describe('toPickersV2Filter', () => {
  it('keeps a provided status', () => {
    expect(toPickersV2Filter({ status: 'PROCESSING' })).toEqual({
      status: 'PROCESSING'
    });
  });

  it('defaults to ALL when the status is missing', () => {
    expect(toPickersV2Filter({})).toEqual({ status: 'ALL' });
  });

  it('defaults to ALL when the status is empty', () => {
    expect(toPickersV2Filter({ status: '' })).toEqual({ status: 'ALL' });
  });

  it('passes an unknown status through without validation', () => {
    expect(toPickersV2Filter({ status: 'bogus' })).toEqual({ status: 'bogus' });
  });

  it('ignores unrelated search params', () => {
    expect(toPickersV2Filter({ status: 'DRAFT', page: '2' })).toEqual({
      status: 'DRAFT'
    });
  });

  it('throws for a null input', () => {
    expect(() => toPickersV2Filter(null)).toThrow(TypeError);
  });
});
