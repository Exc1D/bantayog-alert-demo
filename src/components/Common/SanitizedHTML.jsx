import DOMPurify from 'dompurify';
import { useMemo } from 'react';

const DEFAULT_ALLOWED_TAGS = [
  'b',
  'i',
  'em',
  'strong',
  'p',
  'br',
  'span',
  'ul',
  'ol',
  'li',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
];
const DEFAULT_ALLOWED_ATTR = ['href', 'target', 'rel', 'className', 'class'];

export default function SanitizedHTML({
  html,
  allowedTags = DEFAULT_ALLOWED_TAGS,
  allowedAttr = DEFAULT_ALLOWED_ATTR,
  className = '',
  as: Component = 'div',
  ...props
}) {
  const sanitizedHTML = useMemo(() => {
    if (!html || typeof html !== 'string') {
      return '';
    }

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttr,
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
      ADD_ATTR: ['target', 'rel'],
    });
  }, [html, allowedTags, allowedAttr]);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      {...props}
    />
  );
}

export function SafeLink({ href, children, className = '', ...props }) {
  const sanitizedHref = useMemo(() => {
    if (!href || typeof href !== 'string') {
      return '#';
    }

    try {
      const url = new URL(href);
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

      if (!allowedProtocols.includes(url.protocol)) {
        return '#';
      }

      return href;
    } catch {
      return '#';
    }
  }, [href]);

  return (
    <a
      href={sanitizedHref}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  );
}
