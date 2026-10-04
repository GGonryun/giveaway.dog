import { describe, it, expect } from 'vitest';
import { html } from '../html';

describe('html.toMarkdown', () => {
  describe('headings and inline formatting', () => {
    it('converts headings to atx style', () => {
      expect(html.toMarkdown('<h1>Title</h1><h2>Sub</h2><h3>Three</h3>')).toBe(
        '# Title\n\n## Sub\n\n### Three'
      );
    });

    it('converts strong and em tags', () => {
      expect(
        html.toMarkdown('<p>Hello <strong>world</strong> and <em>you</em></p>')
      ).toBe('Hello **world** and _you_');
    });

    it('converts links to inline markdown links', () => {
      expect(html.toMarkdown('<a href="https://giveaway.dog">Site</a>')).toBe(
        '[Site](https://giveaway.dog)'
      );
    });

    it('converts blockquotes', () => {
      expect(html.toMarkdown('<blockquote>quote</blockquote>')).toBe('> quote');
    });

    it('escapes text that would otherwise become markdown syntax', () => {
      expect(html.toMarkdown('<p>1. not a list</p>')).toBe('1\\. not a list');
    });
  });

  describe('lists', () => {
    it('converts unordered lists with asterisk bullets', () => {
      expect(html.toMarkdown('<ul><li>One</li><li>Two</li></ul>')).toBe(
        '*   One\n*   Two'
      );
    });

    it('converts ordered lists with numbers', () => {
      expect(html.toMarkdown('<ol><li>One</li><li>Two</li></ol>')).toBe(
        '1.  One\n2.  Two'
      );
    });
  });

  describe('code blocks', () => {
    it('converts pre code blocks to fenced blocks with the language', () => {
      expect(
        html.toMarkdown(
          '<pre><code class="language-js">const a = 1;</code></pre>'
        )
      ).toBe('```js\nconst a = 1;\n```');
    });

    it('collapses three or more newlines inside code blocks to two', () => {
      expect(html.toMarkdown('<pre><code>a\n\n\n\nb</code></pre>')).toBe(
        '```\na\n\nb\n```'
      );
    });

    it('collapses exactly three newlines inside code blocks to two', () => {
      expect(html.toMarkdown('<pre><code>a\n\n\nb</code></pre>')).toBe(
        '```\na\n\nb\n```'
      );
    });

    it('collapses every run of three or more newlines', () => {
      expect(html.toMarkdown('<pre><code>a\n\n\nb\n\n\n\nc</code></pre>')).toBe(
        '```\na\n\nb\n\nc\n```'
      );
    });

    it('keeps two consecutive newlines inside code blocks', () => {
      expect(html.toMarkdown('<pre><code>a\n\nb</code></pre>')).toBe(
        '```\na\n\nb\n```'
      );
    });
  });

  describe('whitespace handling', () => {
    it('returns an empty string for empty input', () => {
      expect(html.toMarkdown('')).toBe('');
    });

    it('returns plain text unchanged', () => {
      expect(html.toMarkdown('plain text')).toBe('plain text');
    });

    it('trims surrounding whitespace', () => {
      expect(html.toMarkdown('   <p>  padded  </p>   ')).toBe('padded');
    });

    it('trims a leading non breaking space that the converter keeps', () => {
      expect(html.toMarkdown('<p>&nbsp;x</p>')).toBe('x');
    });

    it('trims the hard break markup produced by a leading line break', () => {
      expect(html.toMarkdown('<br>x')).toBe('x');
    });

    it('drops empty paragraphs between content', () => {
      expect(html.toMarkdown('<p>A</p><p></p><p></p><p>B</p>')).toBe('A\n\nB');
    });

    it('keeps hard line breaks as trailing double spaces', () => {
      expect(html.toMarkdown('<p>a<br><br>b</p>')).toBe('a  \n  \nb');
    });
  });

  it('keeps the text content of script tags', () => {
    expect(html.toMarkdown('<script>alert(1)</script><p>x</p>')).toBe(
      'alert(1)\n\nx'
    );
  });
});
