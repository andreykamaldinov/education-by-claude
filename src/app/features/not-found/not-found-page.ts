import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchService } from '../../core/search/search.service';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-[640px] px-4 py-24 text-center sm:px-6">
      <p class="font-display text-6xl font-semibold text-muted">404</p>
      <h1 class="mt-4 font-display text-2xl font-semibold">Такой страницы нет на полке</h1>
      <p class="mt-3 text-muted">
        Возможно, урок переименовали или ссылка устарела. Найдите тему через поиск или откройте карту треков.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" class="h-11 rounded-xl bg-ink px-5 font-medium text-canvas" (click)="search.open()">
          Открыть поиск
        </button>
        <a routerLink="/tracks" class="inline-flex h-11 items-center rounded-xl border border-line px-5 font-medium hover:bg-sunken">
          Все треки
        </a>
      </div>
    </div>
  `,
})
export class NotFoundPage {
  protected readonly search = inject(SearchService);
}
