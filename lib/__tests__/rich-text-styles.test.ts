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

    it('joins the exact base class groups in order', () => {
      expect(richTextStyles).toBe(
        [
          'prose prose-sm max-w-none',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6',
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5',
          '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4',
          '[&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-3',
          '[&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-3',
          '[&_li]:my-1',
          '[&_p]:min-h-[1.5em] [&_p]:leading-relaxed',
          '[&_strong]:font-bold [&_em]:italic [&_s]:line-through',
          '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm',
          '[&_hr]:my-6 [&_hr]:border-t',
          '[&_br]:block',
          '[&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80'
        ].join(' ')
      );
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
