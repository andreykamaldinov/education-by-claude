import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TocEntry } from '../../shared/markdown/markdown.service';

@Component({
  selector: 'app-table-of-contents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-[13px] font-semibold text-muted">На этой странице</p>
    <ul class="mt-3 space-y-1 border-l border-line">
      @for (entry of entries(); track entry.id) {
        <li>
          <a
            [href]="'#' + entry.id"
            (click)="scrollTo($event, entry.id)"
            class="-ml-px block border-l-2 py-1 text-[13px] leading-snug transition-colors"
            [class]="
              entry.id === activeId()
                ? 'border-track text-ink'
                : 'border-transparent text-muted hover:text-ink'
            "
            [class.pl-3]="entry.depth === 2"
            [class.pl-6]="entry.depth === 3"
          >
            {{ entry.text }}
          </a>
        </li>
      }
    </ul>
  `,
})
export class TableOfContents {
  readonly entries = input.required<readonly TocEntry[]>();
  readonly activeId = input<string | undefined>();

  protected scrollTo(event: MouseEvent, id: string): void {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `${location.pathname}#${id}`);
  }
}
