import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  afterRenderEffect,
  inject,
  input,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import type { RenderedMarkdown } from './markdown.service';

const COPY_RESET_MS = 1600;

/**
 * Displays rendered markdown. Angular sanitizes the [innerHTML] binding (it drops `id`
 * attributes, scripts and event handlers), so heading anchors and copy buttons are added
 * afterwards through the Renderer instead of being trusted from the HTML string.
 */
@Component({
  selector: 'app-markdown-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'prose block',
    '(click)': 'interceptInternalLinks($event)',
  },
  template: `<div [innerHTML]="document().html"></div>`,
})
export class MarkdownView {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly router = inject(Router);

  readonly document = input.required<RenderedMarkdown>();
  /** Emits heading elements once anchors are assigned, for scroll-spy. */
  readonly headingsReady = output<readonly HTMLElement[]>();

  constructor() {
    afterRenderEffect({
      write: () => {
        const toc = this.document().toc;
        const root = this.host.nativeElement;
        const headings = Array.from(root.querySelectorAll<HTMLElement>('h2, h3'));
        headings.forEach((heading, index) => {
          const entry = toc[index];
          if (entry) {
            this.renderer.setAttribute(heading, 'id', entry.id);
          }
        });
        root.querySelectorAll<HTMLElement>('figure.code-block').forEach((figure) => this.addCopyButton(figure));
        this.headingsReady.emit(headings);
      },
    });
  }

  protected interceptInternalLinks(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element) || event.metaKey || event.ctrlKey || event.button !== 0) {
      return;
    }
    const anchor = target.closest('a');
    const href = anchor?.getAttribute('href');
    if (!href || !href.startsWith('/')) {
      return;
    }
    event.preventDefault();
    void this.router.navigateByUrl(href);
  }

  private addCopyButton(figure: HTMLElement): void {
    if (figure.querySelector('.code-copy')) {
      return;
    }
    const code = figure.querySelector('code')?.textContent ?? '';
    const button: HTMLButtonElement = this.renderer.createElement('button');
    this.renderer.addClass(button, 'code-copy');
    this.renderer.setAttribute(button, 'type', 'button');
    this.renderer.setProperty(button, 'textContent', 'Копировать');
    this.renderer.listen(button, 'click', () => {
      void navigator.clipboard?.writeText(code).then(() => {
        this.renderer.setProperty(button, 'textContent', 'Скопировано');
        setTimeout(() => this.renderer.setProperty(button, 'textContent', 'Копировать'), COPY_RESET_MS);
      });
    });
    this.renderer.appendChild(figure, button);
  }
}
