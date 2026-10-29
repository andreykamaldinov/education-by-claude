import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../content/catalog.service';
import { ExerciseCatalogService } from '../../content/exercises/exercise-catalog.service';
import { ProgressService } from '../../core/progress/progress.service';
import { MarkdownView } from '../../shared/markdown/markdown-view';
import { MarkdownService, type RenderedMarkdown } from '../../shared/markdown/markdown.service';
import { Icon } from '../../shared/ui/icon';
import { LevelBadge } from '../../shared/ui/level-badge';
import { TableOfContents } from './table-of-contents';
import { TrackSidebar } from './track-sidebar';

/** Dev servers answer unknown paths with index.html; never render that as a lesson. */
const looksLikeHtmlDocument = (text: string): boolean => /^\s*<!doctype html/i.test(text);

@Component({
  selector: 'app-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarkdownView, TableOfContents, TrackSidebar, Icon, LevelBadge],
  host: {
    '[style.--track]': 'ref()?.track?.accent',
    '[style.--on-track]': 'ref()?.track?.onAccent',
  },
  template: `
    @if (ref(); as ref) {
      <div
        class="mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_210px]"
      >
        <aside class="hidden lg:block">
          <div class="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto py-10 pr-2">
            <app-track-sidebar [track]="ref.track" [currentLessonId]="ref.lesson.id" />
          </div>
        </aside>

        <article class="min-w-0 py-10">
          <button
            type="button"
            class="mb-6 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm text-muted lg:hidden"
            (click)="sidebarOpen.update(open => !open)"
            [attr.aria-expanded]="sidebarOpen()"
          >
            <app-icon name="menu" [size]="16" /> Уроки трека
          </button>
          @if (sidebarOpen()) {
            <div class="mb-8 rounded-2xl border border-line bg-surface p-4 lg:hidden">
              <app-track-sidebar [track]="ref.track" [currentLessonId]="ref.lesson.id" />
            </div>
          }

          <nav class="flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Хлебные крошки">
            <a [routerLink]="['/tracks', ref.track.id]" class="hover:text-ink">{{ ref.track.title }}</a>
            <span aria-hidden="true">/</span>
            <span>{{ ref.section.title }}</span>
          </nav>

          <h1 class="mt-3 max-w-[22ch] font-display text-[28px] leading-tight font-semibold tracking-tight sm:text-[36px]">
            {{ ref.lesson.title }}
          </h1>
          <p class="mt-4 max-w-[64ch] text-lg text-muted">{{ ref.lesson.summary }}</p>
          <div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <app-level-badge [level]="ref.lesson.level" />
            <span class="inline-flex items-center gap-1.5"><app-icon name="clock" [size]="14" /> {{ ref.lesson.minutes }} мин</span>
            <span class="flex flex-wrap gap-1.5">
              @for (tag of ref.lesson.tags; track tag) {
                <span class="rounded-md bg-sunken px-2 py-0.5 text-xs">{{ tag }}</span>
              }
            </span>
          </div>

          <div class="mt-10 border-t border-line pt-8">
            @if (content.isLoading()) {
              <div class="space-y-3" aria-label="Загрузка урока">
                @for (line of skeletonLines; track $index) {
                  <div class="h-4 animate-pulse rounded bg-sunken" [style.width.%]="line"></div>
                }
              </div>
            } @else if (rendered(); as doc) {
              <app-markdown-view [document]="doc" (headingsReady)="observeHeadings($event)" />
            } @else {
              <div class="rounded-2xl border border-line bg-surface p-6">
                <p class="font-medium">Текст урока не загрузился.</p>
                <p class="mt-1 text-muted">
                  Ожидался файл content/{{ ref.track.id }}/{{ ref.lesson.id }}.md. Проверьте соединение и обновите страницу.
                </p>
                <button type="button" class="mt-4 rounded-lg border border-line px-3 py-1.5 text-sm" (click)="content.reload()">
                  Загрузить снова
                </button>
              </div>
            }
          </div>

          @if (relatedExercises().length > 0) {
            <section class="mt-14 rounded-2xl border border-line bg-surface p-6">
              <h2 class="flex items-center gap-2 font-display text-lg font-semibold">
                <app-icon name="code" /> Закрепить на практике
              </h2>
              <ul class="mt-4 space-y-2">
                @for (exercise of relatedExercises(); track exercise.id) {
                  <li>
                    <a [routerLink]="['/practice', exercise.id]" class="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 hover:bg-sunken">
                      <span class="font-medium">{{ exercise.title }}</span>
                      @if (progress.isExerciseSolved(exercise.id)) {
                        <span class="inline-flex items-center gap-1 text-sm text-ok"><app-icon name="check" [size]="14" /> Решено</span>
                      } @else {
                        <app-icon name="arrowRight" [size]="16" class="text-muted" />
                      }
                    </a>
                  </li>
                }
              </ul>
            </section>
          }

          <div class="mt-12 flex flex-wrap items-center gap-4 border-t border-line pt-8">
            <button
              type="button"
              class="inline-flex h-11 items-center gap-2 rounded-xl px-5 font-medium transition-[transform,background-color] active:scale-[0.97]"
              [class]="isCompleted() ? 'bg-ok text-white' : 'bg-track text-on-track'"
              (click)="progress.toggleLesson(ref.track.id, ref.lesson.id)"
              [attr.aria-pressed]="isCompleted()"
            >
              <app-icon name="check" [size]="16" [strokeWidth]="2.4" />
              {{ isCompleted() ? 'Урок пройден' : 'Отметить как пройденный' }}
            </button>
          </div>

          <nav class="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Соседние уроки">
            @if (neighbours().previous; as previous) {
              <a [routerLink]="['/tracks', previous.track.id, previous.lesson.id]" class="rounded-2xl border border-line p-4 hover:bg-sunken">
                <span class="flex items-center gap-1 text-sm text-muted"><app-icon name="arrowLeft" [size]="14" /> Назад</span>
                <span class="mt-1 block font-medium">{{ previous.lesson.title }}</span>
              </a>
            } @else {
              <span></span>
            }
            @if (neighbours().next; as next) {
              <a [routerLink]="['/tracks', next.track.id, next.lesson.id]" class="rounded-2xl border border-line p-4 text-right hover:bg-sunken">
                <span class="flex items-center justify-end gap-1 text-sm text-muted">Дальше <app-icon name="arrowRight" [size]="14" /></span>
                <span class="mt-1 block font-medium">{{ next.lesson.title }}</span>
              </a>
            }
          </nav>
        </article>

        <aside class="hidden xl:block">
          @if (rendered(); as doc) {
            @if (doc.toc.length > 1) {
              <div class="sticky top-16 py-10">
                <app-table-of-contents [entries]="doc.toc" [activeId]="activeHeadingId()" />
              </div>
            }
          }
        </aside>
      </div>
    }
  `,
})
export class LessonPage {
  private readonly catalog = inject(CatalogService);
  private readonly exercises = inject(ExerciseCatalogService);
  private readonly markdown = inject(MarkdownService);
  protected readonly progress = inject(ProgressService);
  private observer: IntersectionObserver | undefined;

  readonly trackId = input.required<string>();
  readonly lessonId = input.required<string>();

  protected readonly skeletonLines = [92, 100, 86, 97, 60, 100, 90, 74] as const;
  protected readonly sidebarOpen = signal(false);
  protected readonly activeHeadingId = signal<string | undefined>(undefined);

  protected readonly ref = computed(() => this.catalog.findLesson(this.trackId(), this.lessonId()));
  protected readonly neighbours = computed(() => this.catalog.neighbours(this.trackId(), this.lessonId()));
  protected readonly isCompleted = computed(() =>
    this.progress.isLessonCompleted(this.trackId(), this.lessonId()),
  );
  protected readonly relatedExercises = computed(() =>
    this.exercises.forLesson(this.trackId(), this.lessonId()),
  );

  /** Re-fetches automatically whenever the route params (and so the URL) change. */
  protected readonly content = httpResource.text(
    () => `content/${this.trackId()}/${this.lessonId()}.md`,
  );

  protected readonly rendered = computed<RenderedMarkdown | undefined>(() => {
    if (this.content.error()) {
      return undefined;
    }
    const text = this.content.value();
    return text === undefined || looksLikeHtmlDocument(text) ? undefined : this.markdown.render(text);
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  protected observeHeadings(headings: readonly HTMLElement[]): void {
    this.observer?.disconnect();
    this.sidebarOpen.set(false);
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          this.activeHeadingId.set(visible.target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    headings.forEach((heading) => this.observer?.observe(heading));
  }
}
