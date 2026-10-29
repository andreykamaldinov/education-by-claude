import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { ExerciseCatalogService } from '../../content/exercises/exercise-catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import type { Track } from '../../domain/catalog.model';
import { Icon } from '../../shared/ui/icon';
import { LevelBadge } from '../../shared/ui/level-badge';

@Component({
  selector: 'app-practice-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, LevelBadge],
  template: `
    <div class="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
      <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Практика</h1>
      <p class="mt-3 max-w-[66ch] text-muted">
        Задачи с автоматическими тестами. Код выполняется в отдельном Web Worker прямо в браузере:
        пишите решение, запускайте Ctrl+Enter и смотрите, какие тесты прошли. Решено {{ solvedCount() }} из {{ exercises.exercises.length }}.
      </p>

      <div class="mt-8 flex flex-wrap gap-2" role="group" aria-label="Фильтр по треку">
        <a
          routerLink="/practice"
          class="rounded-full border px-3.5 py-1.5 text-sm transition-colors"
          [class]="!track() ? 'border-ink bg-ink text-canvas' : 'border-line text-muted hover:text-ink'"
          [attr.aria-current]="!track() ? 'true' : null"
        >
          Все
        </a>
        @for (option of trackOptions(); track option.track.id) {
          <a
            routerLink="/practice"
            [queryParams]="{ track: option.track.id }"
            class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
            [class]="track() === option.track.id ? 'border-ink bg-ink text-canvas' : 'border-line text-muted hover:text-ink'"
            [attr.aria-current]="track() === option.track.id ? 'true' : null"
          >
            <span class="h-2.5 w-2.5 rounded-full" [style.background]="option.track.accent"></span>
            {{ option.track.title }}
            <span class="opacity-70">{{ option.count }}</span>
          </a>
        }
      </div>

      <ul class="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        @for (item of visible(); track item.exercise.id) {
          <li>
            <a
              [routerLink]="['/practice', item.exercise.id]"
              class="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 transition-colors hover:bg-sunken"
            >
              <span class="h-9 w-1.5 shrink-0 rounded-full" [style.background]="item.track?.accent"></span>
              <span class="min-w-0 flex-1">
                <span class="block font-medium">{{ item.exercise.title }}</span>
                <span class="block text-sm text-muted">
                  {{ item.track?.title }}, {{ item.exercise.language === 'typescript' ? 'TypeScript' : 'JavaScript' }},
                  тестов: {{ item.exercise.tests.length }}
                </span>
              </span>
              <app-level-badge [level]="item.exercise.level" />
              @if (progress.isExerciseSolved(item.exercise.id)) {
                <span class="inline-flex w-24 items-center justify-end gap-1 text-sm text-ok">
                  <app-icon name="check" [size]="14" [strokeWidth]="2.4" /> Решено
                </span>
              } @else {
                <span class="w-24 text-right text-sm text-muted">Не решено</span>
              }
            </a>
          </li>
        } @empty {
          <li class="px-5 py-10 text-center text-muted">В этом треке пока нет задач.</li>
        }
      </ul>
    </div>
  `,
})
export class PracticePage {
  private readonly catalog = inject(CatalogService);
  protected readonly exercises = inject(ExerciseCatalogService);
  protected readonly progress = inject(ProgressService);

  /** `?track=angular`, bound by withComponentInputBinding(). */
  readonly track = input<string | undefined>();

  protected readonly solvedCount = computed(() => this.progress.solvedExercisesCount());

  protected readonly trackOptions = computed(() =>
    this.catalog.tracks
      .map((track: Track) => ({ track, count: this.exercises.byTrack(track.id).length }))
      .filter((option) => option.count > 0),
  );

  protected readonly visible = computed(() => {
    const trackId = this.track();
    const list = trackId ? this.exercises.byTrack(trackId) : this.exercises.exercises;
    return list.map((exercise) => ({ exercise, track: this.catalog.findTrack(exercise.trackId) }));
  });
}
