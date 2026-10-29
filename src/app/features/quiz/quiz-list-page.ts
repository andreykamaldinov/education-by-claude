import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { QuizCatalogService } from '../../content/quizzes/quiz-catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-quiz-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <div class="mx-auto max-w-[1100px] px-4 py-12 sm:px-6">
      <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Вопросы для собеседования</h1>
      <p class="mt-3 max-w-[66ch] text-muted">
        Короткие тесты по каждому треку. После ответа открывается разбор: почему верный вариант верен
        и в чём подвох остальных. Лучший результат сохраняется.
      </p>

      <ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (item of items(); track item.track.id) {
          <li>
            <a
              [routerLink]="['/quiz', item.track.id]"
              class="flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-ink/30"
            >
              <span class="flex items-center gap-3">
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-lg font-display text-xs font-semibold"
                  [style.background]="item.track.accent"
                  [style.color]="item.track.onAccent"
                >
                  {{ item.track.short }}
                </span>
                <span class="font-display font-semibold">{{ item.track.title }}</span>
              </span>
              <span class="mt-4 text-sm text-muted">Вопросов: {{ item.count }}</span>
              <span class="mt-auto flex items-center justify-between pt-4 text-sm">
                @if (item.best !== undefined) {
                  <span [class]="item.best >= 80 ? 'text-ok' : 'text-muted'">Лучший результат: {{ item.best }}%</span>
                } @else {
                  <span class="text-muted">Ещё не проходили</span>
                }
                <app-icon name="arrowRight" [size]="16" class="text-muted" />
              </span>
            </a>
          </li>
        }
      </ul>
    </div>
  `,
})
export class QuizListPage {
  private readonly catalog = inject(CatalogService);
  private readonly quizzes = inject(QuizCatalogService);
  private readonly progress = inject(ProgressService);

  protected readonly items = computed(() =>
    this.catalog.tracks.flatMap((track) => {
      const quiz = this.quizzes.find(track.id);
      return quiz
        ? [{ track, count: quiz.questions.length, best: this.progress.quizScores()[track.id] }]
        : [];
    }),
  );
}
