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

  describe('unsafe content', () => {
    it('drops script tags and their content', () => {
      expect(html.toMarkdown('<script>alert(1)</script><p>x</p>')).toBe('x');
    });

    it('drops javascript links and keeps their text', () => {
      expect(html.toMarkdown('<a href="javascript:alert(1)">Click</a>')).toBe(
        'Click'
      );
    });

    it('escapes text that would otherwise become raw HTML', () => {
      expect(html.toMarkdown('<p>&lt;img src=x onerror=alert(1)&gt;</p>')).toBe(
        '\\<img src=x onerror=alert(1)>'
      );
    });

    it('escapes an entity in a link destination so it stays literal', () => {
      expect(
        html.toMarkdown('<a href="javascript&amp;colon;alert(1)">x</a>')
      ).toBe('[x](javascript\\&colon;alert\\(1\\))');
    });

    it('percent-encodes spaces, angle brackets and backticks in a link destination', () => {
      expect(
        html.toMarkdown('<a href=" https://giveaway.dog/a b<c>`d ">x</a>')
      ).toBe('[x](https://giveaway.dog/a%20b%3Cc%3E%60d)');
    });

    it('keeps the query string of a link unchanged', () => {
      expect(
        html.toMarkdown('<a href="https://giveaway.dog/?a=1&amp;b=2">x</a>')
      ).toBe('[x](https://giveaway.dog/?a=1&b=2)');
    });

    it('separates adjacent code spans so their backticks do not merge', () => {
      expect(
        html.toMarkdown(
          '<code>`&lt;img src=x onerror=alert(1)&gt;</code><code>x</code>'
        )
      ).toBe('`` `<img src=x onerror=alert(1)> `` `x`');
    });

    it('keeps inline code that is followed by text unchanged', () => {
      expect(html.toMarkdown('<p>Run <code>pnpm i</code> first</p>')).toBe(
        'Run `pnpm i` first'
      );
    });
  });
});

describe('html.sanitize', () => {
  describe('editor markup', () => {
    it('keeps paragraphs, headings, lists and inline formatting', () => {
      const markup =
        '<h2>Prize</h2><p>Win a <strong>bike</strong>, <em>helmet</em>, <u>lock</u> and <s>car</s></p><ul><li><p>One</p></li></ul><ol><li><p>Two</p></li></ol>';
      expect(html.sanitize(markup)).toBe(markup);
    });

    it('keeps the text alignment style', () => {
      expect(
        html.sanitize(
          '<p style="text-align: center">Centered</p><h1 style="text-align: right">Right</h1>'
        )
      ).toBe(
        '<p style="text-align:center">Centered</p><h1 style="text-align:right">Right</h1>'
      );
    });

    it('keeps the attributes of editor links', () => {
      const link =
        '<a href="https://giveaway.dog" target="_blank" rel="noopener noreferrer nofollow" class="text-primary underline hover:text-primary/80">Site</a>';
      expect(html.sanitize(link)).toBe(link);
    });

    it('keeps mailto and tel links and relative links', () => {
      const links =
        '<a href="mailto:host@giveaway.dog">Mail</a><a href="tel:+15550100">Call</a><a href="/browse">Browse</a>';
      expect(html.sanitize(links)).toBe(links);
    });

    it('keeps code blocks with their language class and blockquotes', () => {
      const markup =
        '<pre><code class="language-js">a &lt; b</code></pre><blockquote><p>Quote</p></blockquote><p>a<br />b</p>';
      expect(html.sanitize(markup)).toBe(markup);
    });
  });

  describe('unsafe markup', () => {
    it('drops script and style tags with their content', () => {
      expect(
        html.sanitize(
          '<script>alert(1)</script><style>p{color:red}</style><p>x</p>'
        )
      ).toBe('<p>x</p>');
    });

    it('drops event handler attributes and tags outside the allow list', () => {
      expect(
        html.sanitize(
          '<p onclick="alert(1)">x</p><img src="x.png" onerror="alert(1)"><iframe src="https://evil.example"></iframe>'
        )
      ).toBe('<p>x</p>');
    });

    it.each([
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      ' \tjavascript:alert(1)',
      'jav&#x61;script:alert(1)',
      'java&#x09;script:alert(1)',
      '&#106;avascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      '//evil.example'
    ])('drops the href %s', (href) => {
      expect(html.sanitize(`<a href="${href}">x</a>`)).toBe('<a>x</a>');
    });

    it('drops styles other than the text alignment', () => {
      expect(
        html.sanitize(
          '<p style="color: red; text-align: left; background: url(javascript:alert(1))">x</p>'
        )
      ).toBe('<p style="text-align:left">x</p>');
    });

    it('drops the style of tags that cannot be aligned', () => {
      expect(
        html.sanitize('<strong style="text-align: center">x</strong>')
      ).toBe('<strong>x</strong>');
    });

    it('escapes stray angle brackets in text', () => {
      expect(html.sanitize('<p>1 < 2 > 0</p>')).toBe('<p>1 &lt; 2 &gt; 0</p>');
    });

    it('returns an empty string for empty input', () => {
      expect(html.sanitize('')).toBe('');
    });
  });
});
