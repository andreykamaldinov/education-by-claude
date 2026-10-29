import { TestBed } from '@angular/core/testing';
import { MarkdownService } from './markdown.service';

describe('MarkdownService', () => {
  let markdown: MarkdownService;

  beforeEach(() => {
    markdown = TestBed.inject(MarkdownService);
  });

  it('collects h2 and h3 into the table of contents with unique Cyrillic slugs', () => {
    const { toc } = markdown.render('## Введение\n\ntext\n\n### Детали `code`\n\n## Введение\n\n#### skipped');

    expect(toc).toEqual([
      { id: 'введение', text: 'Введение', depth: 2 },
      { id: 'детали-code', text: 'Детали code', depth: 3 },
      { id: 'введение-1', text: 'Введение', depth: 2 },
    ]);
  });

  it('highlights known languages and labels the block', () => {
    const { html } = markdown.render('```ts\nconst answer: number = 42;\n```');

    expect(html).toContain('class="code-block"');
    expect(html).toContain('TypeScript');
    expect(html).toContain('hljs-keyword');
  });

  it('escapes code in unknown languages instead of injecting it', () => {
    const { html } = markdown.render('```weird\n<script>alert(1)</script>\n```');

    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('turns tagged blockquotes into callouts', () => {
    const { html } = markdown.render('> [!INTERVIEW]\n> Объясните event loop');

    expect(html).toContain('callout-interview');
    expect(html).toContain('На собеседовании');
    expect(html).not.toContain('[!INTERVIEW]');
  });

  it('keeps plain blockquotes as blockquotes', () => {
    expect(markdown.render('> цитата').html).toContain('<blockquote>');
  });

  it('opens external links safely and leaves internal links alone', () => {
    const { html } = markdown.render('[ext](https://angular.dev) и [int](/tracks/angular/signals)');

    expect(html).toContain('href="https://angular.dev" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('<a href="/tracks/angular/signals">');
  });

  it('wraps tables for horizontal scrolling', () => {
    const { html } = markdown.render('| a | b |\n| --- | --- |\n| 1 | 2 |');

    expect(html).toContain('class="table-wrap"');
    expect(html).toContain('<th>a</th>');
  });
});
