import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { ExerciseCatalogService } from '../../content/exercises/exercise-catalog.service';
import { QuizCatalogService } from '../../content/quizzes/quiz-catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import { Icon } from '../../shared/ui/icon';
import { TrackShelf } from './track-shelf';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TrackShelf, Icon],
  template: `
    <section class="mx-auto max-w-[1400px] px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
      <div class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div class="max-w-[680px]">
          <h1 class="font-display text-[34px] leading-[1.08] font-semibold tracking-[-0.02em] sm:text-[52px]">
            От замыканий до микрофронтендов
          </h1>
          <p class="mt-6 max-w-[60ch] text-lg text-muted">
            Всё, что спрашивают у Angular-разработчика, разложено по полкам: JavaScript, TypeScript,
            Angular изнутри, RxJS, безопасность, SOLID, паттерны, архитектура, сборка и MCP.
            К каждой теме — объяснение с кодом, вопросы с собеседований и задачи с автопроверкой прямо в браузере.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a
              [routerLink]="continueUrl()"
              class="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 font-medium text-canvas transition-transform active:scale-[0.97]"
            >
              {{ hasProgress() ? 'Продолжить обучение' : 'Начать с JavaScript' }}
              <app-icon name="arrowRight" [size]="16" />
            </a>
            <a
              routerLink="/practice"
              class="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 font-medium transition-colors hover:bg-sunken"
            >
              <app-icon name="code" [size]="16" />
              Решать задачи
            </a>
          </div>
          <p class="mt-6 text-sm text-muted">
            {{ lessonCount }} уроков, {{ exerciseCount }} задач с тестами, {{ questionCount }} вопросов для самопроверки
          </p>
        </div>
      </div>

      <div class="mt-14">
        <app-track-shelf [tracks]="catalog.tracks" [planned]="catalog.plannedTracks" />
        <p class="mt-3 text-sm text-muted">
          Корешки стоят в рекомендуемом порядке изучения. Высота — объём трека, полоска внизу — ваш прогресс.
        </p>
      </div>
    </section>

    <section class="mx-auto grid max-w-[1400px] gap-4 px-4 pb-20 sm:px-6 md:grid-cols-3">
      <a routerLink="/tracks" class="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-ink/30">
        <app-icon name="layers" class="text-muted" />
        <h2 class="mt-4 font-display text-lg font-semibold">Карта всех тем</h2>
        <p class="mt-2 text-muted">
          Все треки, разделы и уроки на одной странице — удобно, чтобы найти пробелы перед собеседованием.
        </p>
      </a>
      <a routerLink="/practice" class="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-ink/30">
        <app-icon name="code" class="text-muted" />
        <h2 class="mt-4 font-display text-lg font-semibold">Практика с автопроверкой</h2>
        <p class="mt-2 text-muted">
          Пишете код на JS или TS, жмёте Ctrl+Enter — тесты запускаются в изолированном воркере.
          Решено: {{ progress.solvedExercisesCount() }} из {{ exerciseCount }}.
        </p>
      </a>
      <a routerLink="/quiz" class="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-ink/30">
        <app-icon name="question" class="text-muted" />
        <h2 class="mt-4 font-display text-lg font-semibold">Вопросы с собеседований</h2>
        <p class="mt-2 text-muted">
          Тесты по каждому треку с разбором правильного ответа: event loop, change detection, switchMap и другое.
        </p>
      </a>
    </section>
  `,
})
export class HomePage {
  protected readonly catalog = inject(CatalogService);
  protected readonly progress = inject(ProgressService);
  private readonly exercises = inject(ExerciseCatalogService);
  private readonly quizzes = inject(QuizCatalogService);

  protected readonly lessonCount = this.catalog.lessons.length;
  protected readonly exerciseCount = this.exercises.exercises.length;
  protected readonly questionCount = this.quizzes.quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);

  protected readonly hasProgress = computed(() => this.progress.completedLessonsCount() > 0);

  /** First not-yet-completed lesson in study order. */
  protected readonly continueUrl = computed(() => {
    const next = this.catalog.lessons.find(
      ({ track, lesson }) => !this.progress.isLessonCompleted(track.id, lesson.id),
    );
    return next ? ['/tracks', next.track.id, next.lesson.id] : ['/tracks'];
  });
}
