import sanitizeHtml from 'sanitize-html';

export const slugify = (value: string): string =>
  value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const humanize = (value: string): string =>
  value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote', 'pre', 'code',
    'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'span', 'div',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'iframe', 'video', 'source', 'audio',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: ['src', 'title', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    video: ['src', 'controls', 'poster', 'width', 'height'],
    source: ['src', 'type'],
    audio: ['src', 'controls'],
    '*': ['class', 'style'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowedStyles: {
    '*': {
      'text-align': [/^left$|^right$|^center$|^justify$/],
      'font-weight': [/^\d{3}$|^bold$|^normal$/],
      'font-style': [/^italic$|^normal$/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
  parser: { lowerCaseTags: true },
};

/** Removes unsafe markup from rich text before it is persisted or rendered. */
export const sanitizeRichText = (html: string): string => sanitizeHtml(html, SANITIZE_OPTIONS);

export const stripHtml = (html: string): string =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();

export const truncate = (value: string, length = 200): string =>
  value.length <= length ? value : `${value.slice(0, length - 1).trimEnd()}…`;

export const SORTABLE_SAFE = /^[A-Za-z0-9_.]+$/;

/**
 * Resolves a Mongo reference to its id string.
 *
 * Repository queries `populate()` refs such as `author`, `unit` or `district`,
 * so those fields arrive as sub-documents. Calling `String()` on one yields
 * `"[object Object]"`, which then fails to cast to an ObjectId. Always unwrap
 * with this helper instead.
 */
export const refId = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const nested = (value as { _id?: unknown })._id;
    if (nested) return String(nested);
  }
  return String(value);
};

/** Same as {@link refId} but preserves `null` for optional filter fields. */
export const refIdOrNull = (value: unknown): string | null => refId(value) ?? null;
