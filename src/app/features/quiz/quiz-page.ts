import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { QuizCatalogService } from '../../content/quizzes/quiz-catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import type { QuizAnswer } from '../../domain/quiz.model';
import { MarkdownView } from '../../shared/markdown/markdown-view';
import { MarkdownService } from '../../shared/markdown/markdown.service';
import { Icon } from '../../shared/ui/icon';
import { seededOrder } from '../../shared/utils/seeded-shuffle';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

@Component({
  selector: 'app-quiz-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarkdownView, Icon],
  host: {
    '[style.--track]': 'track()?.accent',
    '[style.--on-track]': 'track()?.onAccent',
  },
  template: `
    <div class="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
      <a routerLink="/quiz" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <app-icon name="arrowLeft" [size]="14" /> Все тесты
      </a>
      <h1 class="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{{ track()?.title }}: вопросы</h1>

      @if (finished()) {
        <section class="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p class="font-display text-5xl font-semibold" [class]="scorePercent() >= 80 ? 'text-ok' : 'text-ink'">
            {{ scorePercent() }}%
          </p>
          <p class="mt-3 text-muted">Верно {{ correctCount() }} из {{ questions().length }}.</p>
          <p class="mt-1 text-muted">{{ verdict() }}</p>
          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" class="inline-flex h-11 items-center gap-2 rounded-xl bg-track px-5 font-medium text-on-track" (click)="restart()">
              <app-icon name="reset" [size]="16" /> Пройти ещё раз
            </button>
            <a [routerLink]="['/tracks', trackId()]" class="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-5 font-medium hover:bg-sunken">
              <app-icon name="book" [size]="16" /> К урокам трека
            </a>
          </div>
        </section>
      } @else if (question(); as question) {
        <div class="mt-8 flex items-center gap-3 text-sm text-muted">
          <span>Вопрос {{ index() + 1 }} из {{ questions().length }}</span>
          <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
            <span class="block h-full rounded-full bg-track transition-[width] duration-300" [style.width.%]="((index() + 1) / questions().length) * 100"></span>
          </span>
        </div>

        <section class="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h2 class="text-lg leading-snug font-semibold">{{ question.prompt }}</h2>
          @if (codeDoc(); as code) {
            <div class="mt-4"><app-markdown-view [document]="code" /></div>
          }

          <ul class="mt-5 space-y-2" role="radiogroup" [attr.aria-label]="question.prompt">
            @for (optionIndex of optionOrder(); track optionIndex; let position = $index) {
              <li>
                <button
                  type="button"
                  role="radio"
                  class="flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default"
                  [class]="optionClass(optionIndex)"
                  [disabled]="currentAnswer().status === 'answered'"
                  [attr.aria-checked]="isChosen(optionIndex)"
                  (click)="answer(optionIndex)"
                >
                  <span class="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current text-xs font-semibold opacity-70">
                    {{ letters[position] }}
                  </span>
                  <span>{{ question.options[optionIndex] }}</span>
                </button>
              </li>
            }
          </ul>

          @if (currentAnswer(); as current) {
            @if (current.status === 'answered') {
              <div class="mt-6 border-t border-line pt-5" aria-live="polite">
                <p class="flex items-center gap-2 font-semibold" [class]="current.correct ? 'text-ok' : 'text-bad'">
                  <app-icon [name]="current.correct ? 'check' : 'close'" [strokeWidth]="2.4" />
                  {{ current.correct ? 'Верно' : 'Неверно' }}
                </p>
                <div class="mt-3"><app-markdown-view [document]="explanationDoc()" /></div>
                <button
                  type="button"
                  class="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-track px-5 font-medium text-on-track active:scale-[0.97]"
                  (click)="next()"
                >
                  {{ isLast() ? 'Показать результат' : 'Следующий вопрос' }}
                  <app-icon name="arrowRight" [size]="16" />
                </button>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
})
export class QuizPage {
  private readonly catalog = inject(CatalogService);
  private readonly quizzes = inject(QuizCatalogService);
  private readonly markdown = inject(MarkdownService);
  private readonly progress = inject(ProgressService);

  readonly trackId = input.required<string>();

  protected readonly letters = OPTION_LETTERS;
  protected readonly track = computed(() => this.catalog.findTrack(this.trackId()));
  protected readonly questions = computed(() => this.quizzes.find(this.trackId())?.questions ?? []);

  protected readonly index = linkedSignal({ source: this.trackId, computation: () => 0 });
  protected readonly answers = linkedSignal<string, readonly QuizAnswer[]>({
    source: this.trackId,
    computation: () => [],
  });
  protected readonly finished = linkedSignal({ source: this.trackId, computation: () => false });
  /** Bumped on restart so a new attempt gets a new option order. */
  protected readonly attempt = linkedSignal({ source: this.trackId, computation: () => 0 });

  protected readonly question = computed(() => this.questions()[this.index()]);
  /** Display order of options: shuffled per question and attempt, stable while answering. */
  protected readonly optionOrder = computed(() => {
    const question = this.question();
    return question ? seededOrder(question.options.length, `${question.id}:${this.attempt()}`) : [];
  });
  protected readonly isLast = computed(() => this.index() === this.questions().length - 1);
  protected readonly currentAnswer = computed<QuizAnswer>(
    () => this.answers()[this.index()] ?? { status: 'unanswered' },
  );
  protected readonly codeDoc = computed(() => {
    const code = this.question()?.code;
    return code ? this.markdown.render(code) : undefined;
  });
  protected readonly explanationDoc = computed(() => this.markdown.render(this.question()?.explanation ?? ''));

  protected readonly correctCount = computed(
    () => this.answers().filter((answer) => answer.status === 'answered' && answer.correct).length,
  );
  protected readonly scorePercent = computed(() =>
    this.questions().length === 0 ? 0 : Math.round((this.correctCount() / this.questions().length) * 100),
  );
  protected readonly verdict = computed(() => {
    const score = this.scorePercent();
    if (score >= 90) return 'Уровень готов к собеседованию.';
    if (score >= 70) return 'Хорошая база. Перечитайте разборы вопросов, где ошиблись.';
    return 'Стоит вернуться к урокам трека и пройти тест ещё раз.';
  });

  protected answer(optionIndex: number): void {
    const question = this.question();
    if (!question || this.currentAnswer().status === 'answered') {
      return;
    }
    const answer: QuizAnswer = {
      status: 'answered',
      chosenIndex: optionIndex,
      correct: optionIndex === question.correctIndex,
    };
    this.answers.update((answers) => {
      const next = [...answers];
      next[this.index()] = answer;
      return next;
    });
  }

  protected next(): void {
    if (this.isLast()) {
      this.finished.set(true);
      this.progress.recordQuizScore(this.trackId(), this.scorePercent());
      return;
    }
    this.index.update((index) => index + 1);
  }

  protected restart(): void {
    this.attempt.update((attempt) => attempt + 1);
    this.index.set(0);
    this.answers.set([]);
    this.finished.set(false);
  }

  protected isChosen(optionIndex: number): boolean {
    const answer = this.currentAnswer();
    return answer.status === 'answered' && answer.chosenIndex === optionIndex;
  }

  protected optionClass(optionIndex: number): string {
    const answer = this.currentAnswer();
    if (answer.status === 'unanswered') {
      return 'border-line hover:border-ink/40 hover:bg-sunken';
    }
    if (optionIndex === this.question()?.correctIndex) {
      return 'border-ok bg-ok/10 text-ink';
    }
    if (optionIndex === answer.chosenIndex) {
      return 'border-bad bg-bad/10 text-ink';
    }
    return 'border-line opacity-60';
  }
}
