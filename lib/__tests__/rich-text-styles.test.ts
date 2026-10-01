import { describe, it, expect } from 'vitest';
import {
  richTextEditorStyles,
  richTextPreviewStyles,
  richTextStyles
} from '../rich-text-styles';

const classes = (value: string) => value.split(' ');

describe('rich text styles', () => {
  describe('richTextStyles', () => {
    it('starts with the prose base classes', () => {
      expect(richTextStyles.startsWith('prose prose-sm max-w-none ')).toBe(
        true
      );
    });

    it('is a single space separated class list', () => {
      expect(richTextStyles).not.toMatch(/\s{2,}/);
      expect(richTextStyles).toBe(richTextStyles.trim());
    });

    it.each([
      '[&_h1]:text-2xl',
      '[&_h2]:text-xl',
      '[&_h3]:text-lg',
      '[&_ul]:list-disc',
      '[&_ol]:list-decimal',
      '[&_li]:my-1',
      '[&_p]:min-h-[1.5em]',
      '[&_strong]:font-bold',
      '[&_em]:italic',
      '[&_s]:line-through',
      '[&_code]:bg-muted',
      '[&_hr]:border-t',
      '[&_br]:block',
      '[&_a]:underline'
    ])('includes %s', (className) => {
      expect(classes(richTextStyles)).toContain(className);
    });

    it('contains 38 classes', () => {
      expect(classes(richTextStyles)).toHaveLength(38);
    });
  });

  describe('richTextEditorStyles', () => {
    it('extends the base styles with editor sizing and focus classes', () => {
      expect(richTextEditorStyles).toBe(
        `${richTextStyles} min-h-[200px] p-4 border-0 focus:outline-none`
      );
    });
  });

  describe('richTextPreviewStyles', () => {
    it('extends the base styles with responsive text and link wrapping classes', () => {
      expect(richTextPreviewStyles).toBe(
        `${richTextStyles} text-sm sm:text-base [&_a]:break-all`
      );
    });
  });
});
