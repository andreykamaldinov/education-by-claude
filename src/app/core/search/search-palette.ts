import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from '../../shared/ui/icon';
import { SearchService, type SearchHit, type SearchHitKind } from './search.service';

const KIND_LABELS = {
  track: 'Трек',
  lesson: 'Урок',
  exercise: 'Задача',
} as const satisfies Record<SearchHitKind, string>;

@Component({
  selector: 'app-search-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: {
    '(document:keydown)': 'onGlobalKeydown($event)',
  },
  template: `
    <dialog
      #dialog
      class="m-auto mt-[10vh] w-[min(640px,calc(100vw-32px))] rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45 backdrop:backdrop-blur-[2px]"
      aria-label="Поиск по платформе"
      (close)="search.close()"
      (click)="closeOnBackdrop($event)"
    >
      <div class="flex items-center gap-3 border-b border-line px-4">
        <app-icon name="search" class="text-muted" />
        <input
          #input
          class="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
          type="search"
          placeholder="Урок, тема или оператор: switchMap, DI, XSS…"
          autocomplete="off"
          [value]="search.query()"
          (input)="onInput($event)"
          (keydown)="onListKeydown($event)"
          role="combobox"
          aria-controls="search-results"
          [attr.aria-activedescendant]="activeId()"
          aria-expanded="true"
        />
        <kbd class="hidden rounded border border-line px-1.5 py-0.5 text-xs text-muted sm:block">Esc</kbd>
      </div>

      <ul id="search-results" role="listbox" class="max-h-[60vh] overflow-y-auto p-2">
        @for (hit of search.hits(); track hit.url; let index = $index) {
          <li
            role="option"
            [id]="'search-hit-' + index"
            [attr.aria-selected]="index === activeIndex()"
            class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5"
            [class.bg-sunken]="index === activeIndex()"
            (mouseenter)="activeIndex.set(index)"
            (click)="go(hit)"
          >
            <span class="h-8 w-1.5 shrink-0 rounded-full" [style.background]="hit.accent"></span>
            <span class="min-w-0 flex-1">
              <span class="block truncate font-medium">{{ hit.title }}</span>
              <span class="block truncate text-sm text-muted">{{ hit.context }}</span>
            </span>
            <span class="text-xs text-muted">{{ kindLabels[hit.kind] }}</span>
          </li>
        } @empty {
          <li class="px-3 py-8 text-center text-muted">
            Ничего не нашлось. Попробуйте другое слово — например, название оператора или хука.
          </li>
        }
      </ul>
    </dialog>
  `,
})
export class SearchPalette {
  protected readonly search = inject(SearchService);
  private readonly router = inject(Router);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly kindLabels = KIND_LABELS;
  protected readonly activeIndex = signal(0);
  protected readonly activeId = () => `search-hit-${this.activeIndex()}`;

  constructor() {
    // Opening from elsewhere (header button, 404 page) goes through the signal.
    effect(() => this.syncDialog(this.search.isOpen()));
  }

  protected onGlobalKeydown(event: KeyboardEvent): void {
    const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
    if (!isShortcut) {
      return;
    }
    event.preventDefault();
    if (this.search.isOpen()) {
      this.search.close();
    } else {
      this.search.open();
    }
    // Sync right away: waiting for the effect would drop the first keystrokes typed after the shortcut.
    this.syncDialog(this.search.isOpen());
  }

  private syncDialog(shouldBeOpen: boolean): void {
    const dialog = this.dialog().nativeElement;
    if (shouldBeOpen && !dialog.open) {
      this.activeIndex.set(0);
      dialog.showModal();
      this.input().nativeElement.focus();
    } else if (!shouldBeOpen && dialog.open) {
      dialog.close();
    }
  }

  protected onInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.search.query.set(event.target.value);
      this.activeIndex.set(0);
    }
  }

  protected onListKeydown(event: KeyboardEvent): void {
    const total = this.search.hits().length;
    if (total === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((index) => (index + 1) % total);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((index) => (index - 1 + total) % total);
    } else if (event.key === 'Enter') {
      const hit = this.search.hits()[this.activeIndex()];
      if (hit) {
        this.go(hit);
      }
    }
  }

  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.search.close();
    }
  }

  protected go(hit: SearchHit): void {
    this.search.close();
    void this.router.navigateByUrl(hit.url);
  }
}
