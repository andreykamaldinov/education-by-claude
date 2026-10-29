/** Turns a heading into a URL fragment. Keeps Cyrillic letters so Russian headings stay readable. */
export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
