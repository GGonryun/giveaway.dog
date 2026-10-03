import { afterEach, describe, expect, it, vi } from 'vitest';
import { sanitizeRichText } from '../sanitize-html';

describe('sanitizeRichText', () => {
  describe('markup the rich text editor produces', () => {
    it.each([
      '<p>Win a <strong>bike</strong> and <em>a helmet</em></p>',
      '<h1>One</h1><h2>Two</h2><h3>Three</h3>',
      '<h4>Four</h4><h5>Five</h5><h6>Six</h6>',
      '<p><u>Underlined</u> and <s>struck</s> and <code>code</code></p>',
      '<ul><li><p>A bike</p></li><li><p>A helmet</p></li></ul>',
      '<ol start="3"><li><p>Third</p></li></ol>',
      '<pre><code>const prize = 1;</code></pre>',
      '<p>Line one<br>Line two</p>',
      '<blockquote><p>Quote</p></blockquote><hr>',
      '<p style="text-align: center;">Centered</p>',
      '<h2 style="text-align: right;">Right</h2>',
      '<p><a target="_blank" rel="noopener noreferrer nofollow" href="https://giveaway.dog">Site</a></p>',
      '<p>a &lt; b &amp; c</p>'
    ])('keeps %s', (html) => {
      expect(sanitizeRichText(html)).toBe(html);
    });

    it('keeps the text of plain text content and escapes it', () => {
      expect(sanitizeRichText('Win 1 < 2 prizes')).toBe('Win 1 &lt; 2 prizes');
    });

    it('returns an empty string for empty content', () => {
      expect(sanitizeRichText('')).toBe('');
    });
  });

  describe('event handler attributes', () => {
    it('removes onerror from an image and the image itself', () => {
      expect(
        sanitizeRichText('<img src="x.png" alt="Prize" onerror="alert(1)">')
      ).toBe('');
    });

    it.each([
      ['onclick', '<p onclick="alert(1)">Prize</p>', '<p>Prize</p>'],
      [
        'onmouseover',
        '<h2 onmouseover="alert(1)">Prize</h2>',
        '<h2>Prize</h2>'
      ],
      [
        'onfocus',
        '<a href="https://giveaway.dog" onfocus="alert(1)" autofocus>Prize</a>',
        '<a href="https://giveaway.dog" target="_blank" rel="noopener noreferrer nofollow">Prize</a>'
      ]
    ])('removes %s from an allowed element', (_name, html, expected) => {
      expect(sanitizeRichText(html)).toBe(expected);
    });

    it('removes an svg with an onload handler', () => {
      expect(sanitizeRichText('<svg onload="alert(1)"></svg><p>Hi</p>')).toBe(
        '<p>Hi</p>'
      );
    });
  });

  describe('links', () => {
    it.each([
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      ' javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)'
    ])('removes the %s href', (href) => {
      expect(sanitizeRichText(`<a href="${href}">Prize</a>`)).toBe(
        '<a>Prize</a>'
      );
    });

    it.each(['https://giveaway.dog/rules', 'mailto:host@example.com'])(
      'keeps the %s href',
      (href) => {
        expect(sanitizeRichText(`<a href="${href}">Rules</a>`)).toBe(
          `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow">Rules</a>`
        );
      }
    );

    it('opens links in a new tab without access to the opener', () => {
      expect(
        sanitizeRichText(
          '<a href="https://giveaway.dog" target="_self" rel="opener">Site</a>'
        )
      ).toBe(
        '<a href="https://giveaway.dog" target="_blank" rel="noopener noreferrer nofollow">Site</a>'
      );
    });

    it('removes target and rel from a link without an href', () => {
      expect(sanitizeRichText('<a target="_blank" rel="opener">Site</a>')).toBe(
        '<a>Site</a>'
      );
    });
  });

  describe('elements outside the allowlist', () => {
    it.each([
      ['script', '<script>alert(1)</script><p>Hi</p>'],
      ['iframe', '<iframe src="https://evil.example"></iframe><p>Hi</p>'],
      ['style', '<style>body { display: none; }</style><p>Hi</p>'],
      ['object', '<object data="evil.swf"></object><p>Hi</p>'],
      ['embed', '<embed src="evil.swf"><p>Hi</p>'],
      ['link', '<link rel="stylesheet" href="evil.css"><p>Hi</p>'],
      ['meta', '<meta http-equiv="refresh" content="0;url=evil"><p>Hi</p>'],
      ['base', '<base href="https://evil.example/"><p>Hi</p>']
    ])('removes a %s element and its content', (_tag, html) => {
      expect(sanitizeRichText(html)).toBe('<p>Hi</p>');
    });

    it('removes form controls and keeps their surrounding text', () => {
      expect(
        sanitizeRichText(
          '<form action="https://evil.example">Password <input name="p"><button>Go</button></form>'
        )
      ).toBe('Password Go');
    });

    it('unwraps unknown elements and keeps their text', () => {
      expect(
        sanitizeRichText('<div><span>Prize</span> <mark>here</mark></div>')
      ).toBe('Prize here');
    });
  });

  describe('attributes outside the allowlist', () => {
    it.each([
      ['class', '<p class="fixed inset-0 z-50">Prize</p>'],
      ['id', '<p id="login">Prize</p>'],
      ['data', '<p data-action="steal">Prize</p>'],
      ['aria', '<p aria-label="Sign in">Prize</p>'],
      ['title', '<p title="Prize">Prize</p>']
    ])('removes the %s attribute', (_name, html) => {
      expect(sanitizeRichText(html)).toBe('<p>Prize</p>');
    });

    it.each([
      'position: fixed; inset: 0',
      'background-image: url(https://evil.example/track.png)',
      'text-align: center; color: red',
      'text-align: expression(alert(1))',
      'text-align: center; position: fixed'
    ])('removes the style "%s"', (style) => {
      expect(sanitizeRichText(`<p style="${style}">Prize</p>`)).toBe(
        '<p>Prize</p>'
      );
    });

    it.each(['left', 'center', 'right', 'justify'])(
      'keeps the %s text alignment and normalises it',
      (align) => {
        expect(
          sanitizeRichText(
            `<p style="  TEXT-ALIGN : ${align.toUpperCase()}  ">Prize</p>`
          )
        ).toBe(`<p style="text-align: ${align};">Prize</p>`);
      }
    );
  });

  describe('the shared DOMPurify instance', () => {
    it('removes its hooks after each call', async () => {
      const { default: DOMPurify } = await import('isomorphic-dompurify');

      sanitizeRichText('<p style="text-align: center;">Prize</p>');

      expect(
        DOMPurify.sanitize(
          '<a href="https://giveaway.dog" style="color: red">Site</a>'
        )
      ).toBe('<a href="https://giveaway.dog" style="color: red">Site</a>');
    });
  });

  describe('when DOMPurify cannot run', () => {
    afterEach(() => {
      vi.doUnmock('isomorphic-dompurify');
      vi.resetModules();
    });

    it('throws instead of returning the HTML unsanitised', async () => {
      const sanitize = vi.fn((html: string) => html);
      vi.resetModules();
      vi.doMock('isomorphic-dompurify', () => ({
        default: {
          isSupported: false,
          sanitize,
          addHook: vi.fn(),
          removeHook: vi.fn()
        }
      }));
      const { sanitizeRichText: sanitizeWithoutDom } =
        await import('../sanitize-html');

      expect(() =>
        sanitizeWithoutDom('<img src="x" onerror="alert(1)">')
      ).toThrow('DOMPurify cannot sanitize HTML in this environment');
      expect(sanitize).not.toHaveBeenCalled();
    });
  });
});
