import sanitizeHtml from 'sanitize-html';
import TurndownService from 'turndown';

const MAX_SANITIZE_PASSES = 5;

const TEXT_ALIGN = [/^(left|right|center|justify)$/];

const ALIGNABLE_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
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
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'class'],
    code: ['class'],
    ...Object.fromEntries(ALIGNABLE_TAGS.map((tag) => [tag, ['style']]))
  },
  allowedStyles: Object.fromEntries(
    ALIGNABLE_TAGS.map((tag) => [tag, { 'text-align': TEXT_ALIGN }])
  ),
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false
};

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

const escapeMarkdown = turndownService.escape.bind(turndownService);
turndownService.escape = (text) => escapeMarkdown(text).replace(/</g, '\\<');

const toMarkdownDestination = (href: string) =>
  href
    .replace(/^[\x00-\x20]+|[\x00-\x20]+$/g, '')
    .replace(/[\t\n\r]/g, '')
    .replace(/[\x00-\x20<>`\x7f]/g, encodeURIComponent)
    .replace(/[()\\]|&(?=#?[0-9a-z]+;)/gi, '\\$&');

turndownService.addRule('inlineLink', {
  filter: (node) => node.nodeName === 'A' && Boolean(node.getAttribute('href')),
  replacement: (content, node) => {
    const destination = toMarkdownDestination(node.getAttribute('href') ?? '');
    return destination ? `[${content}](${destination})` : content;
  }
});

const INLINE_BOUNDARIES = new Set([
  'P',
  'PRE',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'BODY',
  'X-TURNDOWN'
]);

interface TreeNode {
  nodeName: string;
  nodeType: number;
  nextSibling: TreeNode | null;
  parentNode: TreeNode | null;
}

const isFollowedByElement = (node: TreeNode): boolean => {
  let current = node;
  while (
    !current.nextSibling &&
    current.parentNode &&
    !INLINE_BOUNDARIES.has(current.parentNode.nodeName)
  ) {
    current = current.parentNode;
  }
  return current.nextSibling?.nodeType === 1;
};

turndownService.addRule('code', {
  filter: (node) =>
    node.nodeName === 'CODE' &&
    !(
      node.parentNode?.nodeName === 'PRE' &&
      !node.previousSibling &&
      !node.nextSibling
    ),
  replacement: (content, node) => {
    if (!content) return '';
    const code = content.replace(/\r?\n|\r/g, ' ');
    const extraSpace = /^`|^ .*?[^ ].* $|`$/.test(code) ? ' ' : '';
    const runs: string[] = code.match(/`+/g) ?? [];
    let delimiter = '`';
    while (runs.includes(delimiter)) delimiter += '`';
    const after = isFollowedByElement(node) ? ' ' : '';
    return `${delimiter}${extraSpace}${code}${extraSpace}${delimiter}${after}`;
  }
});

export namespace html {
  export function sanitize(htmlContent: string): string {
    let sanitized = sanitizeHtml(htmlContent, sanitizeOptions);
    for (let pass = 1; pass < MAX_SANITIZE_PASSES; pass++) {
      const next = sanitizeHtml(sanitized, sanitizeOptions);
      if (next === sanitized) break;
      sanitized = next;
    }
    return sanitized;
  }

  export function toMarkdown(htmlContent: string): string {
    const markdown = turndownService.turndown(sanitize(htmlContent));
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }
}
