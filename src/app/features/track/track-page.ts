import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { ExerciseCatalogService } from '../../content/exercises/exercise-catalog.service';
import { QuizCatalogService } from '../../content/quizzes/quiz-catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import { Icon } from '../../shared/ui/icon';
import { LevelBadge } from '../../shared/ui/level-badge';

@Component({
  selector: 'app-track-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, LevelBadge],
  host: {
    '[style.--track]': 'track()?.accent',
    '[style.--on-track]': 'track()?.onAccent',
  },
  template: `
    @if (track(); as track) {
      <header class="border-b border-line bg-surface">
        <div class="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <a routerLink="/tracks" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <app-icon name="arrowLeft" [size]="14" /> Все треки
            </a>
            <div class="mt-5 flex items-center gap-4">
              <span
                class="flex h-14 w-14 items-center justify-center rounded-xl bg-track font-display text-base font-semibold text-on-track"
              >
                {{ track.short }}
              </span>
              <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-[40px]">{{ track.title }}</h1>
            </div>
            <p class="mt-5 max-w-[62ch] text-lg text-muted">{{ track.description }}</p>
            <div class="mt-7 flex flex-wrap gap-3">
              <a
                [routerLink]="continueLink()"
                class="inline-flex h-11 items-center gap-2 rounded-xl bg-track px-5 font-medium text-on-track transition-transform active:scale-[0.97]"
              >
                {{ completed() > 0 ? 'Продолжить' : 'Начать трек' }}
                <app-icon name="arrowRight" [size]="16" />
              </a>
              @if (exerciseCount() > 0) {
                <a
                  routerLink="/practice"
                  [queryParams]="{ track: track.id }"
                  class="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-5 font-medium hover:bg-sunken"
                >
                  <app-icon name="code" [size]="16" /> Задачи ({{ exerciseCount() }})
                </a>
              }
              @if (hasQuiz()) {
                <a
                  [routerLink]="['/quiz', track.id]"
                  class="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-5 font-medium hover:bg-sunken"
                >
                  <app-icon name="question" [size]="16" /> Вопросы
                </a>
              }
            </div>
          </div>
          <dl class="grid grid-cols-3 gap-6 text-sm md:grid-cols-1 md:gap-3 md:text-right">
            <div>
              <dt class="text-muted">Уроков</dt>
              <dd class="font-display text-xl font-semibold">{{ lessonCount() }}</dd>
            </div>
            <div>
              <dt class="text-muted">Чтения</dt>
              <dd class="font-display text-xl font-semibold">{{ totalHours() }}</dd>
            </div>
            <div>
              <dt class="text-muted">Пройдено</dt>
              <dd class="font-display text-xl font-semibold">{{ completed() }} / {{ lessonCount() }}</dd>
            </div>
          </dl>
        </div>
        <div class="h-1 bg-sunken">
          <div class="h-full bg-track transition-[width] duration-500" [style.width.%]="percent()"></div>
        </div>
      </header>

      <div class="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
        <ol class="space-y-12">
          @for (section of track.sections; track section.id; let sectionIndex = $index) {
            <li>
              <h2 class="flex items-baseline gap-3 font-display text-xl font-semibold">
                <span class="text-sm text-muted">{{ sectionIndex + 1 }}</span>
                {{ section.title }}
              </h2>
              <ul class="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                @for (lesson of section.lessons; track lesson.id) {
                  <li>
                    <a
                      [routerLink]="['/tracks', track.id, lesson.id]"
                      class="grid gap-x-5 gap-y-1 px-5 py-4 transition-colors hover:bg-sunken sm:grid-cols-[1fr_auto]"
                    >
                      <span class="flex items-start gap-3">
                        @if (progress.isLessonCompleted(track.id, lesson.id)) {
                          <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white">
                            <app-icon name="check" [size]="13" [strokeWidth]="2.6" />
                          </span>
                        } @else {
                          <span class="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-line"></span>
                        }
                        <span>
                          <span class="block font-medium">{{ lesson.title }}</span>
                          <span class="mt-0.5 block text-sm text-muted">{{ lesson.summary }}</span>
                        </span>
                      </span>
                      <span class="flex items-center gap-4 pl-8 text-xs text-muted sm:pl-0">
                        <app-level-badge [level]="lesson.level" />
                        <span class="inline-flex items-center gap-1">
                          <app-icon name="clock" [size]="13" /> {{ lesson.minutes }} мин
                        </span>
                      </span>
                    </a>
                  </li>
                }
              </ul>
            </li>
          }
        </ol>
      </div>
    }
  `,
})
export class TrackPage {
  private readonly catalog = inject(CatalogService);
  private readonly exercises = inject(ExerciseCatalogService);
  private readonly quizzes = inject(QuizCatalogService);
  protected readonly progress = inject(ProgressService);

  /** Bound from the route by withComponentInputBinding(). */
  readonly trackId = input.required<string>();

  protected readonly track = computed(() => this.catalog.findTrack(this.trackId()));
  protected readonly lessons = computed(() => this.catalog.lessonsOf(this.trackId()));
  protected readonly lessonCount = computed(() => this.lessons().length);
  protected readonly completed = computed(() => this.progress.completedInTrack(this.trackId()));
  protected readonly percent = computed(() =>
    this.lessonCount() === 0 ? 0 : (this.completed() / this.lessonCount()) * 100,
  );
  protected readonly totalHours = computed(() => {
    const minutes = this.lessons().reduce((sum, ref) => sum + ref.lesson.minutes, 0);
    return minutes >= 60 ? `${Math.round(minutes / 6) / 10} ч` : `${minutes} мин`;
  });
  protected readonly exerciseCount = computed(() => this.exercises.byTrack(this.trackId()).length);
  protected readonly hasQuiz = computed(() => this.quizzes.find(this.trackId()) !== undefined);

  protected readonly continueLink = computed(() => {
    const lessons = this.lessons();
    const next =
      lessons.find(({ track, lesson }) => !this.progress.isLessonCompleted(track.id, lesson.id)) ?? lessons[0];
    return next ? ['/tracks', next.track.id, next.lesson.id] : ['/tracks'];
  });
}
