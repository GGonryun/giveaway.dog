import { describe, expect, it } from 'vitest';
import { shapes } from '../shapes';

const toToken = (classes: string) => classes.split(' ')[0].replace('h-', '');

describe('shapes', () => {
  it('matches the snapshot of the size scale', () => {
    expect(shapes.size).toMatchSnapshot();
  });

  it.each(Object.entries(shapes.size))(
    'gives the %s size the same height, width and minimum dimensions',
    (_, classes) => {
      const token = toToken(classes);
      expect(classes.split(' ')).toEqual([
        `h-${token}`,
        `w-${token}`,
        `min-h-${token}`,
        `min-w-${token}`
      ]);
    }
  );

  it('orders the sizes from the smallest to the largest', () => {
    const tokens = Object.values(shapes.size).map((classes) =>
      Number(toToken(classes))
    );
    expect(tokens).toEqual([...tokens].sort((a, b) => a - b));
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});
