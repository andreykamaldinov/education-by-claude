import { Injectable } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import plaintext from 'highlight.js/lib/languages/plaintext';
import scss from 'highlight.js/lib/languages/scss';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import { Marked, type Token, type Tokens } from 'marked';
import { slugify } from '../utils/slugify';

export type TocEntry = {
  readonly id: string;
  readonly text: string;
  readonly depth: 2 | 3;
};

export type RenderedMarkdown = {
  readonly html: string;
  readonly toc: readonly TocEntry[];
};

const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
  ts: 'typescript',
  js: 'javascript',
  html: 'xml',
  angular: 'xml',
  sh: 'bash',
  shell: 'bash',
  text: 'plaintext',
  txt: 'plaintext',
};

const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  xml: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  bash: 'Терминал',
  yaml: 'YAML',
  plaintext: 'Текст',
};

const CALLOUTS = {
  TIP: 'Совет',
  NOTE: 'Важно',
  WARNING: 'Осторожно',
  INTERVIEW: 'На собеседовании',
} as const;
type CalloutKind = keyof typeof CALLOUTS;

const CALLOUT_PATTERN = /^<p>\[!(TIP|NOTE|WARNING|INTERVIEW)\]\s*/;

const isCalloutKind = (value: string): value is CalloutKind => value in CALLOUTS;

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isHeading = (token: Token): token is Tokens.Heading => token.type === 'heading';

const tocDepth = (depth: number): TocEntry['depth'] | undefined =>
  depth === 2 ? 2 : depth === 3 ? 3 : undefined;

const plainHeadingText = (raw: string): string =>
  raw.replace(/`([^`]+)`/g, '$1').replace(/\*\*?([^*]+)\*\*?/g, '$1');

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('plaintext', plaintext);

/**
 * Renders lesson markdown to HTML.
 * The output is still passed through Angular's sanitizer by the [innerHTML] binding,
 * so even a compromised content file cannot inject scripts.
 */
@Injectable({ providedIn: 'root' })
export class MarkdownService {
  private readonly marked = new Marked({
    gfm: true,
    renderer: {
      code({ text, lang }: Tokens.Code): string {
        const requested = (lang ?? 'plaintext').trim().toLowerCase();
        const language = LANGUAGE_ALIASES[requested] ?? requested;
        const known = hljs.getLanguage(language) !== undefined;
        const body = known ? hljs.highlight(text, { language }).value : escapeHtml(text);
        const label = LANGUAGE_LABELS[language] ?? requested;
        return `<figure class="code-block"><figcaption class="code-lang">${label}</figcaption><pre><code class="hljs">${body}</code></pre></figure>`;
      },
      blockquote({ tokens }: Tokens.Blockquote): string {
        const body = this.parser.parse(tokens);
        const match = CALLOUT_PATTERN.exec(body);
        const kind = match?.[1];
        if (!match || kind === undefined || !isCalloutKind(kind)) {
          return `<blockquote>${body}</blockquote>`;
        }
        const content = body.replace(match[0], '<p>');
        return `<aside class="callout callout-${kind.toLowerCase()}"><p class="callout-title">${CALLOUTS[kind]}</p>${content}</aside>`;
      },
      link({ href, title, tokens }: Tokens.Link): string {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        const external = /^https?:\/\//.test(href);
        const targetAttr = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}"${titleAttr}${targetAttr}>${text}</a>`;
      },
      table(token: Tokens.Table): string {
        const head = token.header
          .map((cell) => `<th>${this.parser.parseInline(cell.tokens)}</th>`)
          .join('');
        const rows = token.rows
          .map(
            (row) =>
              `<tr>${row.map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`).join('')}</tr>`,
          )
          .join('');
        return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
      },
    },
  });

  render(source: string): RenderedMarkdown {
    const tokens = this.marked.lexer(source);
    return {
      html: this.marked.parser(tokens),
      toc: this.collectToc(tokens),
    };
  }

  private collectToc(tokens: readonly Token[]): TocEntry[] {
    const seen = new Map<string, number>();
    const entries: TocEntry[] = [];
    for (const token of tokens) {
      const depth = isHeading(token) ? tocDepth(token.depth) : undefined;
      if (!isHeading(token) || depth === undefined) {
        continue;
      }
      const text = plainHeadingText(token.text);
      const base = slugify(text);
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      entries.push({ id: count === 0 ? base : `${base}-${count}`, text, depth });
    }
    return entries;
  }
}
