import { describe, it, expect, vi } from 'vitest';
import { replaceIdsDeep } from '../object';

const sequence = () => {
  let n = 0;
  return vi.fn(() => `new-${++n}`);
};

describe('replaceIdsDeep', () => {
  it('replaces a top level id', () => {
    expect(replaceIdsDeep({ id: 'old', name: 'Task' }, sequence())).toEqual({
      id: 'new-1',
      name: 'Task'
    });
  });

  it('replaces ids in nested objects', () => {
    const value = { id: 'a', child: { id: 'b', grandchild: { id: 'c' } } };

    expect(replaceIdsDeep(value, sequence())).toEqual({
      id: 'new-1',
      child: { id: 'new-2', grandchild: { id: 'new-3' } }
    });
  });

  it('replaces ids of objects inside arrays', () => {
    const value = [{ id: 'a' }, { id: 'b', items: [{ id: 'c' }] }];

    expect(replaceIdsDeep(value, sequence())).toEqual([
      { id: 'new-1' },
      { id: 'new-2', items: [{ id: 'new-3' }] }
    ]);
  });

  it('replaces id keys regardless of their original value', () => {
    const value = { id: { id: 'inner' }, list: [{ id: null }, { id: 7 }] };

    expect(replaceIdsDeep(value, sequence())).toEqual({
      id: 'new-1',
      list: [{ id: 'new-2' }, { id: 'new-3' }]
    });
  });

  it('adds nothing to objects without an id key', () => {
    const generator = sequence();

    expect(
      replaceIdsDeep({ name: 'x', nested: { value: 1 } }, generator)
    ).toEqual({ name: 'x', nested: { value: 1 } });
    expect(generator).not.toHaveBeenCalled();
  });

  it('only replaces the exact id key', () => {
    expect(
      replaceIdsDeep({ taskId: 't', ID: 'x', _id: 'y' }, sequence())
    ).toEqual({ taskId: 't', ID: 'x', _id: 'y' });
  });

  it('does not mutate the input', () => {
    const value = { id: 'a', child: { id: 'b' } };

    replaceIdsDeep(value, sequence());

    expect(value).toEqual({ id: 'a', child: { id: 'b' } });
  });

  it('returns new object and array instances', () => {
    const value = { list: [{ id: 'a' }] };

    const result = replaceIdsDeep(value, sequence());

    expect(result).not.toBe(value);
    expect(result.list).not.toBe(value.list);
  });

  it.each([
    ['a string', 'id'],
    ['a number', 1],
    ['null', null],
    ['undefined', undefined]
  ])('returns %s unchanged', (_label, value) => {
    expect(replaceIdsDeep(value, sequence())).toBe(value);
  });

  it('leaves Date instances untouched', () => {
    const createdAt = new Date('2025-01-01T00:00:00.000Z');

    const result = replaceIdsDeep({ id: 'a', createdAt }, sequence());

    expect(result.createdAt).toBe(createdAt);
  });

  it('does not recurse into class instances', () => {
    class Entity {
      id = 'kept';
    }
    const entity = new Entity();

    const result = replaceIdsDeep({ entity }, sequence());

    expect(result.entity).toBe(entity);
    expect(result.entity.id).toBe('kept');
  });

  it('calls the generator once per id key', () => {
    const generator = sequence();

    replaceIdsDeep([{ id: 1 }, { id: 2 }, { other: { id: 3 } }], generator);

    expect(generator).toHaveBeenCalledTimes(3);
  });
});
