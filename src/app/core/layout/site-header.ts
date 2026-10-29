import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/ui/icon';
import { SearchService } from '../search/search.service';
import { ThemeService } from '../theme/theme.service';

type NavItem = {
  readonly label: string;
  readonly url: string;
  readonly exact: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Треки', url: '/tracks', exact: false },
  { label: 'Практика', url: '/practice', exact: false },
  { label: 'Собеседование', url: '/quiz', exact: false },
];

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, Icon],
  host: { class: 'sticky top-0 z-30 block border-b border-line bg-canvas/85 backdrop-blur-md' },
  template: `
    <div class="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
      <a routerLink="/" class="flex items-center gap-2.5" (click)="menuOpen.set(false)">
        <span class="flex h-7 items-end gap-[3px]" aria-hidden="true">
          <span class="h-5 w-[6px] rounded-[2px] bg-[#E9B501]"></span>
          <span class="h-7 w-[6px] rounded-[2px] bg-[#3178C6]"></span>
          <span class="h-6 w-[6px] rounded-[2px] bg-[#D2193A]"></span>
        </span>
        <span class="font-display text-[17px] font-semibold tracking-tight">DevShelf</span>
      </a>

      <nav class="ml-6 hidden items-center gap-1 md:flex" aria-label="Основная навигация">
        @for (item of navItems; track item.url) {
          <a
            [routerLink]="item.url"
            routerLinkActive="!text-ink bg-sunken"
            class="rounded-lg px-3 py-1.5 text-[15px] text-muted transition-colors hover:text-ink"
          >
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <button
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-muted transition-colors hover:text-ink sm:w-64"
          (click)="search.open()"
          aria-label="Открыть поиск"
        >
          <app-icon name="search" [size]="16" />
          <span class="hidden sm:inline">Поиск по урокам</span>
          <kbd class="ml-auto hidden rounded border border-line px-1.5 text-[11px] sm:inline">Ctrl K</kbd>
        </button>

        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-ink"
          (click)="theme.toggle()"
          [attr.aria-label]="theme.resolved() === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'"
        >
          <app-icon [name]="theme.resolved() === 'dark' ? 'sun' : 'moon'" />
        </button>

        <button
          type="button"
          class="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-ink md:hidden"
          (click)="menuOpen.update(open => !open)"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="mobile-nav"
          aria-label="Меню"
        >
          <app-icon [name]="menuOpen() ? 'close' : 'menu'" />
        </button>
      </div>
    </div>

    @if (menuOpen()) {
      <nav id="mobile-nav" class="border-t border-line px-4 py-2 md:hidden" aria-label="Мобильная навигация">
        @for (item of navItems; track item.url) {
          <a
            [routerLink]="item.url"
            routerLinkActive="!text-ink"
            class="block rounded-lg px-2 py-2.5 text-muted"
            (click)="menuOpen.set(false)"
          >
            {{ item.label }}
          </a>
        }
      </nav>
    }
  `,
})
export class SiteHeader {
  protected readonly search = inject(SearchService);
  protected readonly theme = inject(ThemeService);
  protected readonly navItems = NAV_ITEMS;
  protected readonly menuOpen = signal(false);
}
