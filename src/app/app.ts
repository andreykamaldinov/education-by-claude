import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeader } from './core/layout/site-header';
import { SearchPalette } from './core/search/search-palette';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SiteHeader, SearchPalette],
  host: { class: 'flex min-h-dvh flex-col' },
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
    >
      Перейти к содержимому
    </a>
    <app-site-header />
    <main id="main" class="flex-1">
      <router-outlet />
    </main>
    <footer class="border-t border-line">
      <div class="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted sm:px-6">
        <span>DevShelf — теория и практика для фронтенд-разработчика</span>
        <span class="sm:ml-auto">Прогресс хранится в этом браузере</span>
      </div>
    </footer>
    <app-search-palette />
  `,
})
export class App {}
