/**
 * Combines class names, filtering out falsy values.
 * Lightweight alternative to clsx for simple use cases.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
