import DOMPurify, {
  type Config,
  type UponSanitizeAttributeHook
} from 'isomorphic-dompurify';

const RICH_TEXT_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'code',
    'pre',
    'blockquote',
    'hr',
    'ul',
    'ol',
    'li',
    'a'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'start'],
  ALLOW_DATA_ATTR: false,
  ALLOW_ARIA_ATTR: false
};

const TEXT_ALIGN_STYLE =
  /^\s*text-align\s*:\s*(left|center|right|justify)\s*;?\s*$/i;

const keepOnlyTextAlign: UponSanitizeAttributeHook = (_node, data) => {
  if (data.attrName !== 'style') return;

  const match = TEXT_ALIGN_STYLE.exec(data.attrValue);
  if (match) {
    data.attrValue = `text-align: ${match[1].toLowerCase()};`;
  } else {
    data.keepAttr = false;
  }
};

const openLinksSafely = (node: Element) => {
  if (node.tagName !== 'A') return;

  if (node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  } else {
    node.removeAttribute('target');
    node.removeAttribute('rel');
  }
};

export function sanitizeRichText(html: string): string {
  DOMPurify.addHook('uponSanitizeAttribute', keepOnlyTextAlign);
  DOMPurify.addHook('afterSanitizeAttributes', openLinksSafely);
  try {
    return DOMPurify.sanitize(html, RICH_TEXT_CONFIG);
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes');
    DOMPurify.removeHook('uponSanitizeAttribute');
  }
}
