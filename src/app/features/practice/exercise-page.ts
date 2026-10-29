import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { ExerciseCatalogService } from '../../content/exercises/exercise-catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import { LocalStorageService } from '../../core/storage/local-storage.service';
import { type RunResult, isRunPassed } from '../../domain/exercise.model';
import { MarkdownView } from '../../shared/markdown/markdown-view';
import { MarkdownService } from '../../shared/markdown/markdown.service';
import { Icon } from '../../shared/ui/icon';
import { LevelBadge } from '../../shared/ui/level-badge';
import { CodeEditor } from './code-editor';
import { RunReport } from './run-report';
import { CodeRunnerRegistry } from './runner/code-runner';

type RunState =
  | { readonly status: 'idle' }
  | { readonly status: 'running' }
  | { readonly status: 'done'; readonly result: RunResult };

const draftKey = (exerciseId: string): string => `draft.${exerciseId}`;

@Component({
  selector: 'app-exercise-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarkdownView, CodeEditor, RunReport, Icon, LevelBadge],
  host: {
    '[style.--track]': 'track()?.accent',
    '[style.--on-track]': 'track()?.onAccent',
  },
  template: `
    @if (exercise(); as exercise) {
      <div class="mx-auto grid max-w-[1500px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section class="min-w-0">
          <a routerLink="/practice" [queryParams]="{ track: exercise.trackId }" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <app-icon name="arrowLeft" [size]="14" /> Задачи: {{ track()?.title }}
          </a>
          <h1 class="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{{ exercise.title }}</h1>
          <div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted">
            <app-level-badge [level]="exercise.level" />
            <span>{{ exercise.language === 'typescript' ? 'TypeScript' : 'JavaScript' }}</span>
            @if (solved()) {
              <span class="inline-flex items-center gap-1 text-ok"><app-icon name="check" [size]="14" [strokeWidth]="2.4" /> Решено</span>
            }
          </div>

          <div class="mt-6">
            <app-markdown-view [document]="description()" />
          </div>

          @if (exercise.hints.length > 0) {
            <div class="mt-8 space-y-2">
              @for (hint of shownHints(); track $index) {
                <div class="rounded-xl border border-line bg-surface px-4 py-3 text-[15px]">
                  <span class="font-medium">Подсказка {{ $index + 1 }}.</span> {{ hint }}
                </div>
              }
              @if (shownHints().length < exercise.hints.length) {
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:text-ink"
                  (click)="hintsShown.update(count => count + 1)"
                >
                  <app-icon name="bulb" [size]="16" />
                  Показать подсказку ({{ shownHints().length + 1 }} из {{ exercise.hints.length }})
                </button>
              }
            </div>
          }

          @if (relatedLesson(); as related) {
            <a
              [routerLink]="['/tracks', related.track.id, related.lesson.id]"
              class="mt-8 flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm hover:bg-sunken"
            >
              <app-icon name="book" class="text-muted" />
              <span>Теория: <span class="font-medium">{{ related.lesson.title }}</span></span>
            </a>
          }
        </section>

        <section class="flex min-w-0 flex-col gap-4">
          <div class="overflow-hidden rounded-2xl border border-line">
            <div class="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2">
              <button
                type="button"
                class="inline-flex h-9 items-center gap-2 rounded-lg bg-track px-4 text-sm font-medium text-on-track transition-transform active:scale-[0.97] disabled:opacity-60"
                (click)="run()"
                [disabled]="runState().status === 'running'"
              >
                <app-icon name="play" [size]="15" />
                {{ runState().status === 'running' ? 'Выполняется…' : 'Запустить тесты' }}
              </button>
              <kbd class="hidden text-xs text-muted sm:inline">Ctrl+Enter</kbd>
              <span class="ml-auto flex gap-1">
                <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted hover:bg-sunken hover:text-ink" (click)="reset()">
                  <app-icon name="reset" [size]="15" /> Сбросить
                </button>
                <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-muted hover:bg-sunken hover:text-ink" (click)="toggleSolution()">
                  <app-icon name="eye" [size]="15" /> {{ solutionVisible() ? 'Скрыть решение' : 'Решение' }}
                </button>
              </span>
            </div>
            <div class="h-[min(62vh,560px)] min-h-[320px]">
              <app-code-editor
                [(code)]="code"
                [language]="exercise.language"
                ariaLabel="Решение задачи"
                (runRequested)="run()"
              />
            </div>
          </div>

          @if (solutionVisible()) {
            <div class="rounded-2xl border border-line bg-surface p-4">
              <p class="text-sm font-semibold">Эталонное решение</p>
              <p class="mt-1 text-sm text-muted">Сначала попробуйте сами — так материал запоминается в разы лучше.</p>
              <div class="mt-3">
                <app-markdown-view [document]="solutionDoc()" />
              </div>
              <button type="button" class="mt-3 text-sm text-link underline underline-offset-2" (click)="code.set(exercise.solution)">
                Вставить решение в редактор
              </button>
            </div>
          }

          <div class="rounded-2xl border border-line bg-surface p-4">
            @switch (runState().status) {
              @case ('idle') {
                <p class="text-sm text-muted">
                  Нажмите «Запустить тесты», чтобы проверить решение. Тестов в задаче: {{ exercise.tests.length }}.
                  console.log тоже работает — вывод появится здесь.
                </p>
              }
              @case ('running') {
                <p class="text-sm text-muted">Запускаем код в песочнице…</p>
              }
              @case ('done') {
                @if (lastResult(); as result) {
                  <app-run-report [result]="result" />
                }
                @if (solved() && nextExercise(); as next) {
                  <a [routerLink]="['/practice', next.id]" class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-link">
                    Следующая задача: {{ next.title }} <app-icon name="arrowRight" [size]="14" />
                  </a>
                }
              }
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class ExercisePage {
  private readonly catalog = inject(CatalogService);
  private readonly exercises = inject(ExerciseCatalogService);
  private readonly markdown = inject(MarkdownService);
  private readonly runner = inject(CodeRunnerRegistry);
  private readonly storage = inject(LocalStorageService);
  private readonly progress = inject(ProgressService);

  readonly exerciseId = input.required<string>();

  protected readonly exercise = computed(() => this.exercises.find(this.exerciseId()));
  protected readonly track = computed(() => {
    const exercise = this.exercise();
    return exercise ? this.catalog.findTrack(exercise.trackId) : undefined;
  });
  protected readonly relatedLesson = computed(() => {
    const exercise = this.exercise();
    return exercise?.relatedLessonId
      ? this.catalog.findLesson(exercise.trackId, exercise.relatedLessonId)
      : undefined;
  });
  protected readonly nextExercise = computed(() => this.exercises.next(this.exerciseId()));
  protected readonly solved = computed(() => this.progress.isExerciseSolved(this.exerciseId()));

  protected readonly description = computed(() => this.markdown.render(this.exercise()?.description ?? ''));
  protected readonly solutionDoc = computed(() => {
    const exercise = this.exercise();
    const fence = exercise?.language === 'typescript' ? 'ts' : 'js';
    return this.markdown.render(`\`\`\`${fence}\n${exercise?.solution ?? ''}\n\`\`\``);
  });

  /** Resets to the saved draft (or the starter) whenever the exercise changes. */
  protected readonly code = linkedSignal(() => this.readDraft());
  protected readonly hintsShown = linkedSignal({ source: this.exerciseId, computation: () => 0 });
  protected readonly solutionVisible = linkedSignal({ source: this.exerciseId, computation: () => false });
  protected readonly runState = linkedSignal<string, RunState>({
    source: this.exerciseId,
    computation: () => ({ status: 'idle' }),
  });

  protected readonly shownHints = computed(() => this.exercise()?.hints.slice(0, this.hintsShown()) ?? []);
  protected readonly lastResult = computed(() => {
    const state = this.runState();
    return state.status === 'done' ? state.result : undefined;
  });

  private readonly runToken = signal(0);

  constructor() {
    effect(() => this.storage.write(draftKey(this.exerciseId()), this.code()));
  }

  protected async run(): Promise<void> {
    const exercise = this.exercise();
    if (!exercise || this.runState().status === 'running') {
      return;
    }
    const token = this.runToken() + 1;
    this.runToken.set(token);
    this.runState.set({ status: 'running' });
    const result = await this.runner.run({
      language: exercise.language,
      code: this.code(),
      tests: exercise.tests,
    });
    if (token !== this.runToken() || exercise.id !== this.exerciseId()) {
      return; // The learner navigated away while the worker was running.
    }
    this.runState.set({ status: 'done', result });
    if (isRunPassed(result)) {
      this.progress.markExerciseSolved(exercise.id);
    }
  }

  protected reset(): void {
    this.code.set(this.exercise()?.starter ?? '');
    this.runState.set({ status: 'idle' });
  }

  protected toggleSolution(): void {
    this.solutionVisible.update((visible) => !visible);
  }

  private readDraft(): string {
    const exercise = this.exercise();
    const draft = this.storage.read(draftKey(this.exerciseId()));
    return typeof draft === 'string' && draft.trim() !== '' ? draft : (exercise?.starter ?? '');
  }
}
