import { describe, expect, it } from 'vitest';
import { text } from '../text';

describe('text', () => {
  it('matches the snapshot of the text tokens', () => {
    expect(text).toMatchSnapshot();
  });

  it.each(Object.entries(text.size))(
    'maps the %s size to a single text size class',
    (_, className) => {
      expect(className).toMatch(/^text-(xs|sm|base|lg|xl|2xl|3xl)$/);
    }
  );

  it('maps the md and base sizes to the same class', () => {
    expect(text.size.md).toBe(text.size.base);
  });

  it.each(Object.entries(text.weight))(
    'maps the %s weight to the matching font class',
    (weight, className) => {
      expect(className).toBe(`font-${weight}`);
    }
  );

  it.each(Object.entries(text.color))(
    'maps the %s color to a text color class',
    (_, className) => {
      expect(className).toMatch(/^text-[a-z-]+$/);
    }
  );

  it.each(Object.entries(text.leading))(
    'maps the %s leading to a leading class',
    (_, className) => {
      expect(className).toMatch(/^leading-[a-z0-9]+$/);
    }
  );

  it('breaks long words and scrolls horizontally', () => {
    expect(text.words.break.split(' ')).toEqual([
      'break-words',
      'overflow-x-auto'
    ]);
  });
});
