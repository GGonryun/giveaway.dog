import { describe, expect, it } from 'vitest';
import { shapes } from '../shapes';

describe('shapes', () => {
  it('matches the snapshot of the size scale', () => {
    expect(shapes.size).toMatchSnapshot();
  });
});
