import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertProperty } from '@giveaway/testing-server/property';
import { html } from '../html';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'code',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote'
];

const DANGEROUS_TAGS = [
  'script',
  'style',
  'iframe',
  'img',
  'svg',
  'object',
  'embed',
  'a',
  'math',
  'template',
  'noscript',
  'textarea',
  'title',
  'xmp',
  'form',
  'button',
  'base',
  'meta',
  'link',
  'animate',
  'set',
  'use'
];

const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'target', 'rel', 'class'],
  code: ['class'],
  p: ['style'],
  h1: ['style'],
  h2: ['style'],
  h3: ['style'],
  h4: ['style'],
  h5: ['style'],
  h6: ['style']
};

const SAFE_SCHEMES = ['http', 'https', 'mailto', 'tel'];

const DANGEROUS_SCHEMES = ['javascript', 'vbscript', 'data'];

const lowerName = fc.stringMatching(/^[a-z][a-z0-9-]{0,8}$/);

const tagName = fc.mixedCase(
  fc.oneof(
    { arbitrary: fc.constant('a'), weight: 2 },
    fc.constantFrom(...ALLOWED_TAGS),
    fc.constantFrom(...DANGEROUS_TAGS),
    lowerName,
    lowerName.map((name) => `${name}:${name}`)
  )
);

const attributeName = fc.mixedCase(
  fc.oneof(
    { arbitrary: fc.constantFrom('href', 'src'), weight: 2 },
    fc.constantFrom(
      'href',
      'src',
      'xlink:href',
      'formaction',
      'action',
      'style',
      'class',
      'target',
      'rel',
      'srcdoc',
      'background',
      'poster',
      'data',
      'values',
      'to',
      'attributename',
      'http-equiv',
      'content'
    ),
    fc.stringMatching(/^[a-z]{1,10}$/).map((event) => `on${event}`),
    lowerName
  )
);

const schemeSeparator = fc.constantFrom(
  ':',
  '&colon;',
  '&#58;',
  '&#x3a;',
  '&#X3A;',
  '&#0000058',
  '%3a',
  '&amp;colon;',
  '&amp;#58;'
);

const obfuscation = fc.constantFrom(
  '',
  '\t',
  '\n',
  '\r',
  ' ',
  '\u0000',
  '\u001f',
  '&#x09;',
  '&#10;',
  '&Tab;',
  '&NewLine;',
  '&#0;'
);

const obfuscatedWord = (word: string) =>
  fc
    .array(obfuscation, { minLength: word.length, maxLength: word.length })
    .chain((gaps) =>
      fc
        .mixedCase(fc.constant(word))
        .map((cased) =>
          [...cased].map((char, index) => `${gaps[index]}${char}`).join('')
        )
    );

const entityEncodedWord = (word: string) =>
  fc
    .array(fc.constantFrom('plain', 'decimal', 'hex', 'padded'), {
      minLength: word.length,
      maxLength: word.length
    })
    .map((encodings) =>
      [...word]
        .map((char, index) => {
          const code = char.charCodeAt(0);
          switch (encodings[index]) {
            case 'decimal':
              return `&#${code};`;
            case 'hex':
              return `&#x${code.toString(16)};`;
            case 'padded':
              return `&#000${code}`;
            default:
              return char;
          }
        })
        .join('')
    );

const scheme = fc.oneof(
  fc
    .constantFrom(...DANGEROUS_SCHEMES, ...SAFE_SCHEMES)
    .chain((word) =>
      fc.oneof(obfuscatedWord(word), entityEncodedWord(word), fc.constant(word))
    )
    .chain((word) => schemeSeparator.map((separator) => `${word}${separator}`)),
  fc.constantFrom('//', '/', '\\\\', '/\\', '', '#', '?', './'),
  lowerName.map((name) => `${name}:`)
);

const urlValue = fc
  .tuple(
    obfuscation,
    scheme,
    fc.oneof(
      fc.constantFrom(
        'alert(1)',
        'text/html,<script>alert(1)</script>',
        'text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'msgbox(1)',
        'giveaway.dog/path?a=1&b=2',
        'evil.com'
      ),
      fc.string()
    )
  )
  .map((parts) => parts.join(''));

const styleValue = fc
  .tuple(
    fc.mixedCase(
      fc.constantFrom(
        'text-align',
        'color',
        'background',
        'background-image',
        'position',
        'behavior',
        '-moz-binding'
      )
    ),
    fc.constantFrom(':', ' : ', ''),
    fc.oneof(
      fc.constantFrom(
        'center',
        'left',
        'right',
        'justify',
        'red',
        'url(javascript:alert(1))',
        'expression(alert(1))',
        'fixed',
        'center; background:url(javascript:alert(1))'
      ),
      urlValue.map((url) => `url(${url})`),
      fc.string()
    ),
    fc.constantFrom('', ';', '; text-align: center', ' !important')
  )
  .map((parts) => parts.join(''));

const attributeValue = fc.oneof(urlValue, styleValue, fc.string());

const quote = fc.constantFrom('"', "'", '', '`');

const attribute = fc.oneof(
  fc
    .tuple(
      fc.constantFrom(' ', '  ', '\t', '\n', '/'),
      attributeName,
      fc.constantFrom('=', ' = '),
      quote,
      attributeValue
    )
    .map(
      ([space, name, equals, q, value]) =>
        `${space}${name}${equals}${q}${value}${q}`
    ),
  attributeName.map((name) => ` ${name}`)
);

const brokenMarkup = fc
  .array(
    fc.constantFrom(
      '<',
      '>',
      '</',
      '/>',
      '<!--',
      '-->',
      '--!>',
      '<![CDATA[',
      ']]>',
      '<?',
      '<!DOCTYPE html>',
      '<a',
      '<script',
      '</script',
      '<p',
      '</p',
      '&',
      '&#',
      '&lt;',
      '&gt;',
      '&#x3C;script&#x3E;',
      '"',
      "'",
      '=',
      '`',
      '[',
      ']',
      '(',
      ')',
      '\\'
    ),
    { minLength: 1, maxLength: 6 }
  )
  .map((parts) => parts.join(''));

const text = fc.oneof(
  fc.string(),
  fc.string({ unit: 'grapheme' }),
  fc.string({ unit: 'binary' })
);

const { node } = fc.letrec<{ node: string; element: string; link: string }>(
  (tie) => ({
    node: fc.oneof(
      { depthSize: 'small', withCrossShrink: true },
      text,
      brokenMarkup,
      tie('element'),
      tie('link')
    ),
    link: fc
      .record({
        name: fc.mixedCase(fc.constantFrom('href', 'src', 'xlink:href')),
        q: quote,
        url: urlValue,
        children: fc.array(tie('node'), { maxLength: 2 })
      })
      .map(
        ({ name, q, url, children }) =>
          `<a ${name}=${q}${url}${q}>${children.join('')}</a>`
      ),
    element: fc
      .record({
        open: tagName,
        close: fc.option(tagName, { nil: undefined }),
        attributes: fc.array(attribute, { maxLength: 4 }),
        children: fc.array(tie('node'), { maxLength: 4 }),
        selfClosing: fc.boolean(),
        closing: fc.constantFrom('matching', 'other', 'none')
      })
      .map(({ open, close, attributes, children, selfClosing, closing }) => {
        const start = `<${open}${attributes.join('')}${selfClosing ? ' /' : ''}>`;
        const end =
          closing === 'none'
            ? ''
            : `</${closing === 'other' && close ? close : open}>`;
        return `${start}${children.join('')}${end}`;
      })
  })
);

const htmlInput = fc
  .array(node, { maxLength: 5 })
  .map((nodes) => nodes.join(''));

const decodeEntities = (value: string) =>
  value.replace(
    /&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|#39);?/gi,
    (_, entity: string) => {
      const lower = entity.toLowerCase();
      if (lower.startsWith('#x')) {
        return String.fromCodePoint(parseInt(lower.slice(2), 16) || 0xfffd);
      }
      if (lower.startsWith('#')) {
        return String.fromCodePoint(parseInt(lower.slice(1), 10) || 0xfffd);
      }
      return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[lower] ?? "'";
    }
  );

const schemeOf = (url: string) => {
  const normalized = url.replace(/[\x00-\x20\x7f-\x9f]/g, '').toLowerCase();
  return /^([a-z][a-z0-9+.-]*):/.exec(normalized)?.[1];
};

const TAG = /<(\/?)([^\s/>]+)([^>]*?)\s*\/?>/g;

const ATTRIBUTE = /\s([^\s=]+)(?:="([^"]*)")?/g;

const sanitizedViolations = (output: string): string[] => {
  const violations: string[] = [];
  const rest = output.replace(TAG, '');
  if (/[<>]/.test(rest)) violations.push(`markup outside a tag: ${rest}`);

  for (const [, closing, rawName, attributes] of output.matchAll(TAG)) {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.includes(name)) violations.push(`tag <${rawName}>`);
    if (closing && attributes.trim()) {
      violations.push(`closing tag with attributes </${rawName}${attributes}>`);
    }
    if (/\son[a-z]+\s*=/i.test(attributes.replace(/"[^"]*"/g, '""'))) {
      violations.push(`event handler in <${rawName}${attributes}>`);
    }
    const leftover = attributes.replace(ATTRIBUTE, '').trim();
    if (leftover) {
      violations.push(`unparsed attributes in <${rawName}${attributes}>`);
    }

    for (const [, attributeName, rawValue = ''] of attributes.matchAll(
      ATTRIBUTE
    )) {
      const lowerAttribute = attributeName.toLowerCase();
      const value = decodeEntities(rawValue);
      if (!(ALLOWED_ATTRIBUTES[name] ?? []).includes(lowerAttribute)) {
        violations.push(`attribute ${attributeName} on <${rawName}>`);
      }
      if (lowerAttribute === 'href' || lowerAttribute === 'src') {
        const found = schemeOf(value);
        if (found !== undefined && !SAFE_SCHEMES.includes(found)) {
          violations.push(`${attributeName} with scheme ${found}: ${value}`);
        }
        if (/^[\x00-\x20]*[/\\]{2}/.test(value)) {
          violations.push(`protocol relative ${attributeName}: ${value}`);
        }
      }
      if (
        lowerAttribute === 'style' &&
        !/^text-align:(left|right|center|justify);?$/.test(value)
      ) {
        violations.push(`style ${value}`);
      }
    }
  }
  return violations;
};

const stripFencedCode = (markdown: string) => {
  const kept: string[] = [];
  let fence: string | undefined;
  for (const line of markdown.split('\n')) {
    const match = /^[ >]*(`{3,}|~{3,})/.exec(line);
    if (fence === undefined) {
      if (match) fence = match[1];
      else kept.push(line);
    } else if (
      match &&
      match[1][0] === fence[0] &&
      match[1].length >= fence.length &&
      line.slice(match.index + match[0].length).trim() === ''
    ) {
      fence = undefined;
    }
  }
  return kept.join('\n');
};

const scanMarkdown = (markdown: string) => {
  const source = stripFencedCode(markdown);
  let prose = '';
  const unescapedLessThan: number[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      prose += source.slice(index, index + 2);
      index += 2;
      continue;
    }
    if (char === '`') {
      const run = /^`+/.exec(source.slice(index))![0];
      const closing = new RegExp(`(?<!\`)${run}(?!\`)`, 'g');
      closing.lastIndex = index + run.length;
      const close = closing.exec(source);
      if (close) {
        index = close.index + run.length;
        prose += ' ';
        continue;
      }
      prose += run;
      index += run.length;
      continue;
    }
    if (char === '<') unescapedLessThan.push(prose.length);
    prose += char;
    index += 1;
  }
  return { prose, unescapedLessThan };
};

const NAMED_ENTITIES: Record<string, string> = {
  colon: ':',
  tab: '\t',
  newline: '\n',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'"
};

const decodeMarkdownDestination = (destination: string) =>
  destination.replace(
    /\\([!-/:-@[-`{-~])|&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi,
    (match, escaped: string | undefined, entity: string | undefined) => {
      if (escaped !== undefined) return escaped;
      const lower = entity!.toLowerCase();
      if (lower.startsWith('#')) return decodeEntities(match);
      return NAMED_ENTITIES[lower] ?? match;
    }
  );

const linkDestinations = (prose: string) => [
  ...[...prose.matchAll(/\]\(\s*<?([^\s)>]*)/g)].map((match) => match[1]),
  ...[...prose.matchAll(/^[ >]*\[[^\]]*\]:\s*<?(\S*)/gm)].map(
    (match) => match[1]
  )
];

describe('html.sanitize properties', () => {
  it('[HTML-001] sanitize never throws and keeps only allowed tags, attributes and URL schemes', () => {
    assertProperty(
      fc.property(htmlInput, (input) => {
        const output = html.sanitize(input);
        expect(output).not.toMatch(
          /<\s*\/?\s*(script|iframe|object|embed|style)/i
        );
        expect(sanitizedViolations(output)).toEqual([]);
      })
    );
  });

  it('[HTML-002] sanitize is idempotent', () => {
    assertProperty(
      fc.property(htmlInput, (input) => {
        const once = html.sanitize(input);
        expect(html.sanitize(once)).toBe(once);
      })
    );
  });
});

describe('html.toMarkdown properties', () => {
  it('[HTML-003] toMarkdown never throws and emits no raw HTML outside code', () => {
    assertProperty(
      fc.property(htmlInput, (input) => {
        const markdown = html.toMarkdown(input);
        const { prose, unescapedLessThan } = scanMarkdown(markdown);
        expect(
          unescapedLessThan.map((at) =>
            prose.slice(Math.max(0, at - 10), at + 10)
          )
        ).toEqual([]);
      })
    );
  });

  it('[HTML-004] toMarkdown never emits a link to a javascript, vbscript or data URL', () => {
    assertProperty(
      fc.property(htmlInput, (input) => {
        const { prose } = scanMarkdown(html.toMarkdown(input));
        const dangerous = linkDestinations(prose).filter((destination) => {
          const found = schemeOf(decodeMarkdownDestination(destination));
          return found !== undefined && DANGEROUS_SCHEMES.includes(found);
        });
        expect(dangerous).toEqual([]);
      })
    );
  });
});
