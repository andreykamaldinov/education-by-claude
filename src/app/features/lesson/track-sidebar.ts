import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressService } from '../../core/progress/progress.service';
import type { Track } from '../../domain/catalog.model';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-track-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon],
  template: `
    <a [routerLink]="['/tracks', track().id]" class="flex items-center gap-2.5 font-display font-semibold">
      <span class="h-6 w-1.5 rounded-full bg-track"></span>
      {{ track().title }}
    </a>
    <nav class="mt-5 space-y-6" [attr.aria-label]="'Уроки трека ' + track().title">
      @for (section of track().sections; track section.id) {
        <div>
          <p class="px-2 text-[13px] font-semibold text-muted">{{ section.title }}</p>
          <ul class="mt-1.5 space-y-0.5">
            @for (lesson of section.lessons; track lesson.id) {
              @let isCurrent = lesson.id === currentLessonId();
              <li>
                <a
                  [routerLink]="['/tracks', track().id, lesson.id]"
                  class="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[14px] leading-snug transition-colors"
                  [class]="isCurrent ? 'bg-sunken font-medium text-ink' : 'text-muted hover:text-ink'"
                  [attr.aria-current]="isCurrent ? 'page' : null"
                >
                  @if (progress.isLessonCompleted(track().id, lesson.id)) {
                    <app-icon name="check" [size]="14" [strokeWidth]="2.4" class="mt-[3px] text-ok" />
                  } @else {
                    <span
                      class="mt-[7px] mr-[4px] ml-[4px] h-1.5 w-1.5 shrink-0 rounded-full"
                      [class]="isCurrent ? 'bg-track' : 'bg-line'"
                    ></span>
                  }
                  <span>{{ lesson.title }}</span>
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>
  `,
})
export class TrackSidebar {
  protected readonly progress = inject(ProgressService);
  readonly track = input.required<Track>();
  readonly currentLessonId = input.required<string>();
}
